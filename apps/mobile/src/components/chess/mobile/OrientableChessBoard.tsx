import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Chess } from 'chess.js';
import * as orientationUtils from '../../../utils/chess/orientation-utils';

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
  showCoordinates?: boolean;
}

// Chess piece image mapping
const PIECE_IMAGES = {
  'w-p': require('../../../../assets/pieces/wp.png'),
  'w-n': require('../../../../assets/pieces/wn.png'),
  'w-b': require('../../../../assets/pieces/wb.png'),
  'w-r': require('../../../../assets/pieces/wr.png'),
  'w-q': require('../../../../assets/pieces/wq.png'),
  'w-k': require('../../../../assets/pieces/wk.png'),
  'b-p': require('../../../../assets/pieces/bp.png'),
  'b-n': require('../../../../assets/pieces/bn.png'),
  'b-b': require('../../../../assets/pieces/bb.png'),
  'b-r': require('../../../../assets/pieces/br.png'),
  'b-q': require('../../../../assets/pieces/bq.png'),
  'b-k': require('../../../../assets/pieces/bk.png'),
};

/**
 * A custom chessboard component that supports orientation changes
 */
const OrientableChessBoard: React.FC<OrientableChessBoardProps> = ({
  initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation = 'white',
  onMove,
  showCoordinates = true,
}) => {
  const { theme } = useTheme();
  const [boardSize, setBoardSize] = useState(calculateBoardSize());
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(orientation);
  const [position, setPosition] = useState<BoardPosition>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  
  const chessRef = useRef<Chess>(new Chess(initialFen));
  const squareSize = boardSize / 8;

  // Update board size when window resizes
  useEffect(() => {
    const updateBoardSize = () => {
      setBoardSize(calculateBoardSize());
    };
    
    // React Native's Dimensions API changed in newer versions
    // This handles both older and newer versions
    try {
      // For newer versions of React Native
      const subscription = Dimensions.addEventListener('change', updateBoardSize);
      
      return () => {
        // Clean up the subscription
        subscription.remove();
      };
    } catch (error) {
      // Fallback for older versions
      console.log('Using legacy Dimensions API');
      return () => {};
    }
  }, []);

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
      console.error('Error loading FEN:', error);
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

  // Toggle the board orientation
  const toggleOrientation = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  // Handle square click
  const handleSquareClick = (square: string) => {
    if (selectedSquare) {
      // If a square is already selected, try to move
      if (selectedSquare !== square) {
        try {
          const chess = chessRef.current;
          const move = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Always promote to queen for simplicity
          });
          
          if (move) {
            updatePositionFromChess();
            setLastMove({ from: selectedSquare, to: square });
            if (onMove) {
              onMove(selectedSquare, square);
            }
          }
        } catch (error) {
          console.error('Invalid move:', error);
        }
      }
      // Clear selection regardless
      setSelectedSquare(null);
    } else {
      // Check if the clicked square has a piece of the current player
      const piece = position[square];
      const currentPlayer = chessRef.current.turn();
      
      if (piece && ((currentPlayer === 'w' && piece.color === 'w') || 
                   (currentPlayer === 'b' && piece.color === 'b'))) {
        setSelectedSquare(square);
      }
    }
  };

  // Render a square on the board
  const renderSquare = (row: number, col: number) => {
    const isBlack = (row + col) % 2 === 1;
    const squareColor = isBlack ? '#769656' : '#eeeed2';
    
    // Map visual position to algebraic notation based on orientation
    const file = boardOrientation === 'white' ? col : 7 - col;
    const rank = boardOrientation === 'white' ? 7 - row : row;
    const square = String.fromCharCode(97 + file) + (rank + 1);
    
    // Determine if this square is selected or part of the last move
    const isSelected = square === selectedSquare;
    const isLastMoveFrom = lastMove && square === lastMove.from;
    const isLastMoveTo = lastMove && square === lastMove.to;
    
    // Get the piece on this square, if any
    const piece = position[square];
    
    // Determine background color with highlights
    let backgroundColor = squareColor;
    if (isSelected) {
      backgroundColor = '#baca2b'; // Highlight selected square
    } else if (isLastMoveFrom || isLastMoveTo) {
      backgroundColor = '#f7f769'; // Highlight last move
    }
    
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          { 
            width: squareSize, 
            height: squareSize, 
            backgroundColor 
          }
        ]}
        onPress={() => handleSquareClick(square)}
      >
        {piece && (
          <Image
            source={PIECE_IMAGES[`${piece.color}-${piece.type}`]}
            style={[styles.piece, { width: squareSize * 0.85, height: squareSize * 0.85 }]}
            resizeMode="contain"
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
                {boardOrientation === 'white' ? 8 - row : row + 1}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(row => renderRow(row))}
      </View>
      
      <TouchableOpacity 
        style={[styles.orientationButton, { backgroundColor: theme.accent }]} 
        onPress={toggleOrientation}
      >
        <Text style={styles.buttonText}>
          Switch to {boardOrientation === 'white' ? 'Black' : 'White'} View
        </Text>
      </TouchableOpacity>
      
      {lastMove && (
        <Text style={[styles.moveText, { color: theme.text }]}>
          Last move: {lastMove.from} to {lastMove.to}
        </Text>
      )}
    </View>
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
  orientationButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  moveText: {
    marginTop: 8,
    fontSize: 14,
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