import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Chessboard from 'react-native-chessboard';
import { Chess, Square } from 'chess.js';
import { loadSounds, playSound, unloadSounds } from '../../../utils/sounds';
import { useTheme } from '../../../contexts/ThemeContext';

export const MobileChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const [boardSize, setBoardSize] = useState(calculateBoardSize());

  // Calculate optimal board size
  function calculateBoardSize() {
    const { width, height } = Dimensions.get('window');
    const smallerDimension = Math.min(width, height);
    return smallerDimension * 0.85; // 85% of the smaller dimension
  }

  // Update board size on dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      setBoardSize(calculateBoardSize());
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      subscription.remove();
    };
  }, []);

  // Load sounds on mount
  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, [boardSize]);

  const attemptPlaySound = useCallback(async (soundName: 'move' | 'capture' | 'check') => {
    try {
      await playSound(soundName);
    } catch (_) {
      // Silently handle errors
    }
  }, []);

  const makeMove = useCallback(async (moveInfo: any) => {
    try {
      // Extract move information
      const from = moveInfo.from || moveInfo.moveFrom || (moveInfo.move && moveInfo.move.from);
      const to = moveInfo.to || moveInfo.moveTo || (moveInfo.move && moveInfo.move.to);

      if (!from || !to) {
        return false;
      }

      // Create a new game instance and make the move
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: from as Square,
        to: to as Square,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move) {
        // Update game state first
        setGame(newGame);
        
        // Determine which sound to play
        let soundToPlay: 'move' | 'capture' | 'check' = 'move';
        if (move.captured) {
          soundToPlay = 'capture';
        } else if (move.san.includes('+')) {
          soundToPlay = 'check';
        }

        // Play the sound immediately after the move is confirmed
        try {
          await attemptPlaySound(soundToPlay);
        } catch (_) {
          // Silently handle errors
        }
        
        return true;
      }
      
      return move !== null;
    } catch (_) {
      return false;
    }
  }, [game, attemptPlaySound]);

  return (
    <View style={styles.container}>
      <Chessboard
        gestureEnabled={true}
        onMove={makeMove}
        boardSize={boardSize}
        colors={{
          black: isDark ? '#B7C0D8' : '#E8EDF9',
          white: isDark ? '#E8EDF9' : '#FFFFFF',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
}); 