import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChessPiece } from '../ChessPiece';
import { Gesture } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useChessBoard } from '../../../hooks/useChessBoard';

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
  const boardRef = useRef<View>(null);

  const {
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
    updateBoardPosition, // ← This is the new function we'll add to the hook
  } = useChessBoard({
    initialFen,
    orientation,
    onMove,
    onDragStart,
    onDragEnd,
  });

  // This effect updates the board position in the hook whenever the board size changes
  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Call the hook's function to update board position
        updateBoardPosition({ x: pageX, y: pageY });
      });
    }
  }, [boardSize, updateBoardPosition]);

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