import { useRef, useCallback, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming, runOnJS, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { mapCoordinatesToSquare } from '../utils/chess/orientation-utils';
import { playSound } from '../utils/sounds';
import { triggerHaptic } from '../utils/haptics';

interface BoardPosition {
  [square: string]: {
    type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    color: 'w' | 'b';
  } | null;
}

interface AnimatingPiece {
  piece: string;
  fromSquare: string;
  toSquare: string;
  fromCoords: { x: number; y: number };
  toCoords: { x: number; y: number };
}

interface UseChessBoardProps {
  initialFen?: string;
  orientation?: 'white' | 'black';
  onMove?: (from: string, to: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface UseChessBoardResult {
  boardSize: number;
  squareSize: number;
  position: BoardPosition;
  lastMove: { from: string; to: string } | null;
  draggedPiece: { square: string; piece: string } | null;
  animatingPiece: AnimatingPiece | null;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  handleMove: (from: string, to: string) => boolean;
  createPieceGesture: (square: string, piece: string) => ReturnType<typeof Gesture.Pan>;
  getSquareCoordinates: (square: string) => { x: number; y: number };
  updateBoardPosition: (position: { x: number; y: number }) => void;
}

// Animation configurations for smoother movements
const ANIMATION_CONFIG = {
  duration: 150,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic bezier for natural movement
};

/**
 * Hook to manage chess board state and interactions
 */
export function useChessBoard({
  initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation = 'white',
  onMove,
  onDragStart,
  onDragEnd,
}: UseChessBoardProps): UseChessBoardResult {
  const [boardSize, setBoardSize] = useState(calculateBoardSize());
  const [position, setPosition] = useState<BoardPosition>({});
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: string } | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);

  const chessRef = useRef<Chess>(new Chess(initialFen));
  const isAnimating = useRef(false);
  const squareSize = boardSize / 8;

  // Ref to track board position
  const boardPositionRef = useRef({ x: 0, y: 0 });

  // Animation values
  const animX = useSharedValue(0);
  const animY = useSharedValue(0);
  const animOpacity = useSharedValue(1);
  const animScale = useSharedValue(1);
  const animElevation = useSharedValue(1);

  const updateBoardPosition = useCallback((position: { x: number; y: number }) => {
    boardPositionRef.current = position;
  }, []);

  // Calculate optimal board size
  function calculateBoardSize() {
    const { width, height } = Dimensions.get('window');
    const size = Math.min(width, height * 0.8); // 80% of the smaller dimension
    return size;
  }

  // Update board size when window resizes
  useEffect(() => {
    const updateBoardSize = () => {
      setBoardSize(calculateBoardSize());
    };

    const subscription = Dimensions.addEventListener('change', updateBoardSize);
    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize or update the board position from FEN
  useEffect(() => {
    try {
      const chess = chessRef.current;
      if (initialFen) {
        chess.load(initialFen);
        setLastMove(null);
      }
      updatePositionFromChess();
    } catch (_) {
      // Silently handle errors
    }
  }, [initialFen]);

  // Update position when orientation changes
  useEffect(() => {
    updatePositionFromChess();
  }, [orientation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: squareSize,
      height: squareSize,
      transform: [
        { translateX: animX.value },
        { translateY: animY.value },
        { scale: animScale.value }
      ],
      opacity: animOpacity.value,
      zIndex: 10,
      elevation: animElevation.value,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: animElevation.value / 2 },
      shadowOpacity: 0.3,
      shadowRadius: animElevation.value,
    };
  }, [squareSize]);

  // Update the position state from the chess instance
  const updatePositionFromChess = useCallback(() => {
    const chess = chessRef.current;
    const newPosition: BoardPosition = {};
    const board = chess.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const square = String.fromCharCode(97 + file) + (8 - rank);
          newPosition[square] = {
            type: piece.type as any,
            color: piece.color
          };
        }
      }
    }

    setPosition(newPosition);
  }, []);

  const getSquareCoordinates = useCallback((square: string) => {
    const file = square.charCodeAt(0) - 97; // 'a' is 97 in ASCII
    const rank = parseInt(square[1]) - 1;

    const col = orientation === 'white' ? file : 7 - file;
    const row = orientation === 'white' ? 7 - rank : rank;

    return { x: col * squareSize, y: row * squareSize };
  }, [orientation, squareSize]);

  const handleMove = useCallback((from: string, to: string) => {
    if (isAnimating.current) return false;
    isAnimating.current = true;

    const chess = chessRef.current;

    // Check if this would be a valid move before attempting it
    const moves = chess.moves({ verbose: true });
    const isValidMove = moves.some(
      move => move.from === from && move.to === to
    );

    if (!isValidMove) {
      isAnimating.current = false;
      return false;
    }

    // Make the move immediately
    const result = chess.move({ from, to, promotion: 'q' });
    if (result) {
      updatePositionFromChess();
      setLastMove({ from, to });
      
      if (onMove) {
        onMove(from, to);
      }

      // Play appropriate sound and haptic feedback
      let soundToPlay: 'move' | 'capture' | 'check' = 'move';
      if (result.captured) {
        soundToPlay = 'capture';
        triggerHaptic('medium');
      } else if (result.san.includes('+')) {
        soundToPlay = 'check';
        triggerHaptic('heavy');
      } else {
        triggerHaptic('medium');
      }
      playSound(soundToPlay);
    }

    isAnimating.current = false;
    return true;
  }, [updatePositionFromChess, onMove]);

  // Create a gesture handler for chess pieces
  const createPieceGesture = useCallback((square: string, piece: string) => {
    return Gesture.Pan()
      .runOnJS(true)  // Run all callbacks on JS thread - critical for proper gesture handling
      .onBegin(() => {
        setDraggedPiece({ square, piece });
        triggerHaptic('light');
        if (onDragStart) {
          onDragStart();
        }
      })
      .onFinalize((event) => {
        if (draggedPiece) {
          // Use the absolute coordinates and adjust for board position
          const boardPosition = boardPositionRef.current;

          // Calculate board-relative coordinates
          const relativeX = event.absoluteX - boardPosition.x;
          const relativeY = event.absoluteY - boardPosition.y;

          const toSquare = mapCoordinatesToSquare(
            { x: relativeX, y: relativeY },
            orientation,
            squareSize
          );

          if (toSquare && toSquare !== draggedPiece.square) {
            handleMove(draggedPiece.square, toSquare);
          }
        }

        setDraggedPiece(null);
        if (onDragEnd) {
          onDragEnd();
        }
      });
  }, [draggedPiece, orientation, squareSize, handleMove, onDragStart, onDragEnd]);

  return {
    boardSize,
    squareSize,
    position,
    lastMove,
    draggedPiece,
    animatingPiece,
    animatedStyle,
    handleMove,
    createPieceGesture,
    getSquareCoordinates,
    updateBoardPosition,
  };
}
