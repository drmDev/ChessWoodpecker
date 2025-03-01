import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Chessboard from 'react-native-chessboard';
import { Chess, Square } from 'chess.js';
import { loadSounds, playSound, unloadSounds } from '../../../utils/sounds';
import { useTheme } from '../../../../../shared/contexts/ThemeContext';

export const MobileChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const { colors, mode, isDark } = useTheme();
  const [boardSize, setBoardSize] = useState(calculateBoardSize());

  // Calculate optimal board size
  function calculateBoardSize() {
    const { width, height } = Dimensions.get('window');
    const smallerDimension = Math.min(width, height);
    
    // Use 85% of the smaller dimension to maximize board size while keeping it visible
    return smallerDimension * 0.85;
  }

  // Update board size on dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      setBoardSize(calculateBoardSize());
    };

    // For newer React Native versions
    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      // Clean up event listener
      subscription.remove();
    };
  }, []);

  // Load sounds on mount
  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  const makeMove = async (moveInfo: any) => {
    try {
      // Extract move information
      const from = moveInfo.from || moveInfo.moveFrom || (moveInfo.move && moveInfo.move.from);
      const to = moveInfo.to || moveInfo.moveTo || (moveInfo.move && moveInfo.move.to);

      // Create a new game instance and make the move
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: from as Square,
        to: to as Square,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move) {
        setGame(newGame);
        
        // Play appropriate sound
        if (move.captured) {
          await playSound('capture');
        } else if (move.san.includes('+')) {
          await playSound('check');
        } else {
          await playSound('move');
        }
      }
      
      return true;
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
  };

  // More vibrant board colors
  const boardColors = isDark 
    ? {
        // Dark mode - rich blue and deep navy
        black: '#1A5276', // Deep blue
        white: '#D6EAF8', // Light blue
      }
    : {
        // Light mode - forest green and cream
        black: '#1E8449', // Forest green
        white: '#FCF3CF', // Cream
      };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.surface }]}>
      <View 
        style={[
          styles.boardContainer, 
          { 
            width: boardSize, 
            height: boardSize,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: isDark ? colors.accent : colors.primary,
          }
        ]}
      >
        <Chessboard
          gestureEnabled={true}
          onMove={makeMove}
          durations={{ move: 200 }}
          colors={boardColors}
          boardSize={boardSize}
          withLetters={false}
          withNumbers={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginVertical: 0,
  },
  boardContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    margin: 0,
    aspectRatio: 1,
  },
}); 