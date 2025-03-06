import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Chess } from 'chess.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChessPiece } from '../ChessPiece';
import { Gesture } from 'react-native-gesture-handler';
import { mapCoordinatesToSquare } from '../../../utils/chess/orientation-utils';
import { playSound } from '../../../utils/sounds';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

// Type for board position
type BoardPosition = {
  [square: string]: {
    type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    color: 'w' | 'b';
  } | null;
};

interface OrientableChessBoardProps {
  initialFen?: string;
  orientation?: 'white' | 'black';
  onMove?: (from: string, to: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showCoordinates?: boolean;
}

/**
 * A custom chessboard component that supports orientation changes and drag-and-drop
 */
const OrientableChessBoard: React.FC<OrientableChessBoardProps> = ({
  initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation = 'white',
  onMove,
  onDragStart,
  onDragEnd,
  showCoordinates = true,
}) => {
  const animX = useSharedValue(0);
  const animY = useSharedValue(0);
  const animOpacity = useSharedValue(1);

  const [boardSize, setBoardSize] = useState(calculateBoardSize());
  const [position, setPosition] = useState<BoardPosition>({});
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: string } | null>(null);

  const chessRef = useRef<Chess>(new Chess(initialFen));
  const squareSize = boardSize / 8;
  const boardRef = useRef<View>(null);

  const [animatingPiece, setAnimatingPiece] = useState<{
    piece: string;
    fromSquare: string;
    toSquare: string;
    fromCoords: { x: number, y: number };
    toCoords: { x: number, y: number };
  } | null>(null);

  // Update board size when window resizes
  useEffect(() => {
    const updateBoardSize = () => {
      const { width, height } = Dimensions.get('window');
      // Make the board fill 100% of the width, with appropriate height
      // Use the full width of the screen, minus any padding
      const size = Math.min(width, height * 0.8);
      setBoardSize(size);
    };

    updateBoardSize();
    const subscription = Dimensions.addEventListener('change', updateBoardSize);

    return () => {
      subscription.remove();
    };
  }, []);

  // Update position when orientation changes
  useEffect(() => {
    updatePositionFromChess();
  }, [orientation]);

  // this function calculates the size of the board based on the screen size
  function calculateBoardSize() {
    const { width, height } = Dimensions.get('window');
    const smallerDimension = Math.min(width, height);
    return Math.floor(smallerDimension * 0.85);
  }

  // Initialize or update the board position from FEN
  React.useEffect(() => {
    try {
      const chess = chessRef.current;
      if (initialFen) {
        chess.load(initialFen);
        // Clear the last move highlight when a new position is loaded
        setLastMove(null);
      }
      updatePositionFromChess();
    } catch (_error) {
      // Silently handle errors
    }
  }, [initialFen]);

  // Update the position state from the chess instance
  const updatePositionFromChess = () => {
    const chess = chessRef.current;
    const newPosition: BoardPosition = {};

    // Get position from chess.js
    const board = chess.board();

    // this loop iterates over the board and adds the pieces to the new position
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
  };

  // this function calculates the coordinates of the square based on the orientation
  const getSquareCoordinates = (square: string) => {
    const file = square.charCodeAt(0) - 97; // 'a' is 97 in ASCII
    const rank = parseInt(square[1]) - 1;

    // Adjust for orientation
    const col = orientation === 'white' ? file : 7 - file;
    const row = orientation === 'white' ? 7 - rank : rank;

    return { x: col * squareSize, y: row * squareSize };
  };

  const handleMove = (from: string, to: string) => {
    try {
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

      // Start the animation
      setAnimatingPiece({
        piece: `${piece.color}-${piece.type}`,
        fromSquare: from,
        toSquare: to,
        fromCoords,
        toCoords
      });

      // Set initial animation position
      animX.value = fromCoords.x;
      animY.value = fromCoords.y;
      animOpacity.value = 1;

      // Animate the piece
      animX.value = withTiming(toCoords.x, { duration: 300 });
      animY.value = withTiming(toCoords.y, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(finalizeMove)(from, to);
        }
      });

      // Create a temporary position that hides the source piece during animation
      const tempPosition = { ...position };
      tempPosition[from] = null;
      setPosition(tempPosition);

      return true;
    } catch (_error) {
      return false;
    }
  };

  const finalizeMove = (from: string, to: string) => {
    try {
      const chess = chessRef.current;

      const move = chess.move({
        from,
        to,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        // soundToPlay can only hold one of the three string values: 'move', 'capture', or 'check', and defaults to 'move'
        let soundToPlay: 'move' | 'capture' | 'check' = 'move';
        if (move.captured) {
          soundToPlay = 'capture';
        } else if (move.san.includes('+')) {
          soundToPlay = 'check';
        }

        playSound(soundToPlay);

        updatePositionFromChess();
        setLastMove({ from, to });
        setAnimatingPiece(null);

        if (onMove) {
          onMove(from, to);
        }
      }
    } catch (_error) {
      // Silently handle errors
    }
  };


  // Add the animated style for the moving piece
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: squareSize,
      height: squareSize,
      transform: [
        { translateX: animX.value },
        { translateY: animY.value }
      ],
      opacity: animOpacity.value,
      zIndex: 10,
    };
  });


  // JS functions to be called from the worklet context
  const jsSetDraggedPiece = (square: string, piece: string) => {
    setDraggedPiece({ square, piece });
    if (onDragStart) {
      onDragStart();
    }
  };

  const jsHandleMove = (fromSquare: string, toSquare: string) => {
    return handleMove(fromSquare, toSquare);
  };

  const jsResetDraggedPiece = () => {
    setDraggedPiece(null);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Get board position for coordinate calculation
  const getBoardPosition = () => {
    if (!boardRef.current) return { x: 0, y: 0 };

    // Measure the board's position on screen
    let position = { x: 0, y: 0 };
    boardRef.current.measure((x, y, width, height, pageX, pageY) => {
      position = { x: pageX, y: pageY };
    });

    return position;
  };

  const createPieceGesture = (square: string, piece: string) => {
    return Gesture.Pan()
      .runOnJS(true)  // Run all callbacks on JS thread
      .onBegin(() => {
        jsSetDraggedPiece(square, piece);
      })
      .onUpdate((event) => {
        // No-op, just track the gesture
      })
      .onFinalize((event) => {
        if (draggedPiece) {
          const boardPosition = getBoardPosition();

          // Calculate board-relative coordinates
          const relativeX = event.absoluteX - boardPosition.x;
          const relativeY = event.absoluteY - boardPosition.y;

          // Calculate the target square from the relative position
          const toSquare = mapCoordinatesToSquare(
            { x: relativeX, y: relativeY },
            orientation,
            squareSize
          );

          // Only attempt a move if we have a valid target square
          if (toSquare && toSquare !== draggedPiece.square) {
            jsHandleMove(draggedPiece.square, toSquare);
            jsResetDraggedPiece();
          } else {
            jsResetDraggedPiece();
          }
        } else {
          jsResetDraggedPiece();
        }
      });
  };

  const renderSquare = (row: number, col: number) => {
    const isBlack = (row + col) % 2 === 1;
    const squareColor = isBlack ? '#769656' : '#eeeed2';

    // Map visual position to algebraic notation based on orientation
    const file = orientation === 'white' ? col : 7 - col;
    const rank = orientation === 'white' ? 7 - row : row;
    const square = String.fromCharCode(97 + file) + (rank + 1);

    // Determine if this square is part of the last move
    const isLastMoveFrom = lastMove && square === lastMove.from;
    const isLastMoveTo = lastMove && square === lastMove.to;

    // Get the piece on this square, if any
    const piece = position[square];

    // Determine background color with highlights
    let backgroundColor = squareColor;
    if (isLastMoveFrom || isLastMoveTo) {
      backgroundColor = '#f7f769'; // Highlight last move
    }

    return (
      <View
        key={`${row}-${col}`}
        style={[
          styles.square,
          {
            width: squareSize,
            height: squareSize,
            backgroundColor
          }
        ]}
      >
        {piece && (
          <ChessPiece
            piece={`${piece.color}-${piece.type}`}
            square={square}
            gesture={createPieceGesture(square, `${piece.color}-${piece.type}`)}
          />
        )}

        {/* Render coordinates if needed */}
        {showCoordinates && (
          <>
            {row === 7 && (
              <Text style={[styles.coordinateLabel, styles.fileLabel]}>
                {String.fromCharCode(97 + file)}
              </Text>
            )}
            {col === 0 && (
              <Text style={[styles.coordinateLabel, styles.rankLabel]}>
                {orientation === 'white' ? 8 - row : row + 1}
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

  // Render a row of squares
  const renderRow = (row: number) => {
    return (
      <View key={row} style={{ flexDirection: 'row' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(col => renderSquare(row, col))}
      </View>
    );
  };

  const renderAnimatingPiece = () => {
    if (!animatingPiece) return null;

    return (
      <Animated.View style={animatedStyle}>
        <ChessPiece
          piece={animatingPiece.piece}
          square={animatingPiece.toSquare}
          gesture={Gesture.Pan().enabled(false)}
        />
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View
        ref={boardRef}
        style={[styles.boardContainer, { width: boardSize, height: boardSize }]}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map(row => renderRow(row))}
        {renderAnimatingPiece()}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    borderColor: '#634a30',
    borderWidth: 2,
    overflow: 'hidden',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  coordinateLabel: {
    color: '#634a30',
    fontSize: 10,
    position: 'absolute',
  },
  fileLabel: {
    bottom: 2,
    right: 2,
  },
  rankLabel: {
    left: 2,
    top: 2,
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});

export default OrientableChessBoard;