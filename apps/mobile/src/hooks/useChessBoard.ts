import { useRef, useCallback, useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming, runOnJS, useAnimatedStyle, Easing, withSpring } from 'react-native-reanimated';
import { mapCoordinatesToSquare } from '../utils/chess/orientation-utils';
import { playSound } from '../utils/sounds';

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
  duration: 250,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic bezier for natural movement
};

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.6,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01
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

  // Function to update board position - this is the new function
  const updateBoardPosition = useCallback((position: { x: number; y: number }) => {
    boardPositionRef.current = position;
  }, []);

  // Calculate optimal board size
  function calculateBoardSize() {
    const { width, height } = Dimensions.get('window');
    const size = Math.min(width, height * 0.8);
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
    } catch (_error) {
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

  // This function completes the move after animation
  const finalizeMove = useCallback((from: string, to: string) => {
    try {
      const chess = chessRef.current;

      const move = chess.move({
        from,
        to,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        let soundToPlay: 'move' | 'capture' | 'check' = 'move';
        if (move.captured) {
          soundToPlay = 'capture';
        } else if (move.san.includes('+')) {
          soundToPlay = 'check';
        }

        playSound(soundToPlay);
        updatePositionFromChess();
        setLastMove({ from, to });
        
        // Fade out the animated piece before removing it
        animOpacity.value = withTiming(0, { duration: 150 }, () => {
          runOnJS(setAnimatingPiece)(null);
        });

        if (onMove) {
          onMove(from, to);
        }
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      isAnimating.current = false;
    }
  }, [onMove, updatePositionFromChess, animOpacity]);

  // This function handles the move and animation
  const handleMove = useCallback((from: string, to: string) => {
    try {
      if (isAnimating.current) {
        return false;
      }

      const chess = chessRef.current;

      // Check if this would be a valid move before attempting it
      const moves = chess.moves({ verbose: true });
      const isValidMove = moves.some(
        move => move.from === from && move.to === to
      );

      if (!isValidMove) {
        return false;
      }

      // Get the piece being moved
      const piece = position[from];
      if (!piece) return false;

      // Calculate the source and destination coordinates
      const fromCoords = getSquareCoordinates(from);
      const toCoords = getSquareCoordinates(to);

      // Mark as animating to prevent multiple moves
      isAnimating.current = true;

      // Set the animating piece
      setAnimatingPiece({
        piece: `${piece.color}-${piece.type}`,
        fromSquare: from,
        toSquare: to,
        fromCoords,
        toCoords
      });

      // Create a temporary position that hides the source piece during animation
      const tempPosition = { ...position };
      tempPosition[from] = null;
      setPosition(tempPosition);

      // Set initial animation position and start animation
      animX.value = fromCoords.x;
      animY.value = fromCoords.y;
      animOpacity.value = 1;
      animScale.value = 1;
      animElevation.value = 5; // Add elevation for better visual effect

      // Animate to destination with natural movement
      // Use spring for more natural movement
      animX.value = withSpring(toCoords.x, SPRING_CONFIG);
      animY.value = withSpring(toCoords.y, SPRING_CONFIG, (finished) => {
        if (finished) {
          // Small bounce effect on arrival
          animScale.value = withTiming(1.05, { duration: 100 }, () => {
            animScale.value = withTiming(1, { duration: 100 });
            animElevation.value = withTiming(1, { duration: 150 });
            
            // This is the critical fix - properly handling the callback
            runOnJS(finalizeMove)(from, to);
          });
        }
      });

      return true;
    } catch (error) {
      // Silently handle errors
      isAnimating.current = false;
      return false;
    }
  }, [position, getSquareCoordinates, animX, animY, animOpacity, animScale, animElevation, finalizeMove]);

  // Create a gesture handler for chess pieces
  const createPieceGesture = useCallback((square: string, piece: string) => {
    return Gesture.Pan()
      .runOnJS(true)  // Run all callbacks on JS thread - critical for proper gesture handling
      .onBegin(() => {
        setDraggedPiece({ square, piece });
        if (onDragStart) {
          onDragStart();
        }
      })
      .onFinalize((event) => {
        if (draggedPiece) {
          // Use the absolute coordinates and adjust for board position
          // This is a critical fix - we need to properly calculate the target square
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