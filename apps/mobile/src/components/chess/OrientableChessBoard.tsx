import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Chessboard, { ChessboardRef } from 'react-native-chessboard';
import { Chess } from 'chess.js';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  BoardOrientation, 
  shouldFlipBoard, 
  calculateBoardTransform, 
  calculatePieceTransform,
  mapTouchCoordinates
} from '../../utils/boardOrientation';

interface OrientableChessBoardProps {
  orientation?: BoardOrientation;
  fen?: string;
  onMove?: (move: any) => void;
  disabled?: boolean;
}

/**
 * A chess board component that supports orientation (white or black perspective)
 */
export const OrientableChessBoard: React.FC<OrientableChessBoardProps> = ({
  orientation = 'white',
  fen,
  onMove,
  disabled = false
}) => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  
  // Calculate board size based on screen width
  const { width } = Dimensions.get('window');
  const boardSize = Math.min(width - 32, 350); // Use smaller of screen width or 350
  
  // Determine if the board should be flipped
  const isFlipped = shouldFlipBoard(orientation);
  
  // Calculate transforms
  const boardTransform = calculateBoardTransform(isFlipped);
  
  // Board colors based on theme
  const boardColors = {
    black: isDark ? '#1A5276' : '#1E8449', // Dark blue or forest green
    white: isDark ? '#D6EAF8' : '#FCF3CF', // Light blue or cream
  };
  
  // Handle moves with coordinate mapping for flipped board
  const handleMove = useCallback((moveInfo: any) => {
    if (disabled || !onMove) return;
    
    // If the board is flipped, we need to adjust the touch coordinates
    if (isFlipped && moveInfo.touchSquare) {
      // Map the touch coordinates
      const { x, y } = mapTouchCoordinates(
        moveInfo.touchSquare.x,
        moveInfo.touchSquare.y,
        boardSize,
        isFlipped
      );
      
      // Update the touch coordinates
      moveInfo.touchSquare = { x, y };
    }
    
    // Call the provided onMove handler
    onMove(moveInfo);
  }, [onMove, isFlipped, boardSize, disabled]);
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.boardContainer, 
          { 
            width: boardSize, 
            height: boardSize,
            transform: boardTransform
          }
        ]}
      >
        <Chessboard
          gestureEnabled={!disabled}
          onMove={handleMove}
          durations={{ move: 200 }}
          colors={boardColors}
          boardSize={boardSize}
          fen={fen || new Chess().fen()}
          withLetters={true}
          withNumbers={true}
          // Note: We can't directly apply transforms to pieces in react-native-chessboard
          // The board transform will flip the entire board including pieces
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
  },
  boardContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
}); 