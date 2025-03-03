import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Chessboard from 'react-native-chessboard';
import { Chess, Square } from 'chess.js';
import { loadSounds, playSound, unloadSounds } from '../../../utils/sounds';
import { useTheme } from '../../../contexts/ThemeContext';

export const MobileChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const [boardSize, setBoardSize] = useState(calculateBoardSize());
  
  const logDebug = useCallback((info: string) => {
    console.log(`[ChessBoard Debug] ${info}`);
  }, []);

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

  // Load sounds on mount and log initial render
  useEffect(() => {
    logDebug('Component mounted');
    logDebug(`Initial render with gestureEnabled=true, boardSize=${boardSize}`);
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, [logDebug, boardSize]);

  const makeMove = useCallback(async (moveInfo: any) => {
    logDebug(`makeMove called: ${JSON.stringify(moveInfo, null, 2)}`);
    try {
      // Extract move information
      const from = moveInfo.from || moveInfo.moveFrom || (moveInfo.move && moveInfo.move.from);
      const to = moveInfo.to || moveInfo.moveTo || (moveInfo.move && moveInfo.move.to);

      if (!from || !to) {
        logDebug(`Invalid move information: missing from (${from}) or to (${to})`);
        return false;
      }

      logDebug(`Attempting move from ${from} to ${to}`);

      // Create a new game instance and make the move
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: from as Square,
        to: to as Square,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move) {
        logDebug(`Move successful: ${move.san}`);
        setGame(newGame);
        
        // Play appropriate sound
        if (move.captured) {
          logDebug('Captured piece - playing capture sound');
          await playSound('capture');
        } else if (move.san.includes('+')) {
          logDebug('Check move - playing check sound');
          await playSound('check');
        } else {
          logDebug('Regular move - playing move sound');
          await playSound('move');
        }
      } else {
        logDebug('Move failed - invalid move');
      }
      
      return true;
    } catch (e) {
      logDebug(`Move error: ${e}`);
      return false;
    }
  }, [game, logDebug]);

  // Debug touch handler
  const handleBoardTouch = useCallback(() => {
    logDebug('Board touched via TouchableWithoutFeedback');
  }, [logDebug]);

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
    <View style={[styles.outerContainer, { backgroundColor: theme.surface }]}>
      <TouchableWithoutFeedback onPress={handleBoardTouch}>
        <View 
          style={[
            styles.boardContainer, 
            { 
              width: boardSize, 
              height: boardSize,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              shadowColor: isDark ? theme.accent : theme.primary,
            }
          ]}
          onTouchStart={() => logDebug('BoardContainer touched')}
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
      </TouchableWithoutFeedback>
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