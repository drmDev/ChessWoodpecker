import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Chess } from 'chess.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChessPiece } from '../ChessPiece';
import { Gesture } from 'react-native-gesture-handler';
import { mapCoordinatesToSquare } from '../../../utils/chess/orientation-utils';
import { playSound } from '../../../utils/sounds';

// Type for chess piece
interface ChessPiece {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
}

// Type for board position
type BoardPosition = {
  [square: string]: ChessPiece | null;
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
  const [boardSize, setBoardSize] = useState(calculateBoardSize());
  const [position, setPosition] = useState<BoardPosition>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: string } | null>(null);
  
  const chessRef = useRef<Chess>(new Chess(initialFen));
  const squareSize = boardSize / 8;
  const boardRef = useRef<View>(null);

  // Update board size when window resizes
  useEffect(() => {
    const updateBoardSize = () => {
      setBoardSize(calculateBoardSize());
    };
    
    try {
      const subscription = Dimensions.addEventListener('change', updateBoardSize);
      return () => {
        subscription.remove();
      };
    } catch (error) {
      return () => {};
    }
  }, []);

  // Update position when orientation changes
  useEffect(() => {
    updatePositionFromChess();
  }, [orientation]);

  // Calculate optimal board size
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
      }
      updatePositionFromChess();
    } catch (error) {
      // Silently handle errors
    }
  }, [initialFen]);

  // Update the position state from the chess instance
  const updatePositionFromChess = () => {
    const chess = chessRef.current;
    const newPosition: BoardPosition = {};
    
    // Get position from chess.js
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
  };

  // Handle piece movement
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

      const move = chess.move({
        from,
        to,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        updatePositionFromChess();
        setLastMove({ from, to });

        // Play appropriate sound based on move type
        try {
          // Determine which sound to play
          let soundToPlay: 'move' | 'capture' | 'check' = 'move';
          if (move.captured) {
            soundToPlay = 'capture';
          } else if (move.san.includes('+')) {
            soundToPlay = 'check';
          }

          playSound(soundToPlay);
        } catch (soundError) {
          // Silently handle errors
        }

        if (onMove) {
          onMove(from, to);
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

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
          // Get board position
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

  // Render a square on the board
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

  return (
    <GestureHandlerRootView style={styles.container}>
      <View 
        ref={boardRef}
        style={[styles.boardContainer, { width: boardSize, height: boardSize }]} 
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map(row => renderRow(row))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  boardContainer: {
    borderWidth: 2,
    borderColor: '#634a30',
    overflow: 'hidden',
  },
  square: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  piece: {
    // Image sizing is handled inline based on square size
  },
  coordinateLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#634a30',
  },
  fileLabel: {
    bottom: 2,
    right: 2,
  },
  rankLabel: {
    top: 2,
    left: 2,
  },
});

export default OrientableChessBoard;