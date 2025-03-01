import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { loadSounds, playSound, unloadSounds } from '../../../utils/sounds';
import { useTheme } from '../../../../../shared/contexts/ThemeContext';

export const WebChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { colors, mode, isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);

  // Calculate board width based on container size
  useEffect(() => {
    const updateBoardSize = () => {
      // Get the parent container's dimensions
      const container = containerRef.current?.parentElement;
      if (container) {
        // Use 90% of the available height, but not more than 80% of width
        const maxHeight = window.innerHeight * 0.7;
        const maxWidth = window.innerWidth * 0.8;
        const optimalSize = Math.min(maxHeight, maxWidth, 700); // Cap at 700px
        setBoardWidth(optimalSize);
      } else {
        // Fallback if container not available
        const width = Math.min(window.innerWidth - 40, 600);
        setBoardWidth(width);
      }
    };

    // Set initial size
    updateBoardSize();

    // Update on resize
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  // Load sounds on mount
  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  // Clear error message after 2 seconds
  const clearError = useCallback(() => {
    setTimeout(() => {
      setErrorMessage(null);
    }, 2000);
  }, []);

  // Handle piece movement
  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    try {
      // Create a new game instance to avoid modifying the current one directly
      const newGame = new Chess(game.fen());
      
      // Attempt to make the move
      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });
      
      // If the move is valid, update the game state
      if (move) {
        setGame(newGame);
        setErrorMessage(null);
        return true;
      }
    } catch (e) {
      setErrorMessage('Invalid move');
      console.error('Move error:', e);
    }
    
    return false;
  };

  // More vibrant board colors
  const darkSquareStyle = isDark 
    ? { backgroundColor: '#1A5276' } // Deep blue for dark mode
    : { backgroundColor: '#1E8449' }; // Forest green for light mode
  
  const lightSquareStyle = isDark 
    ? { backgroundColor: '#D6EAF8' } // Light blue for dark mode
    : { backgroundColor: '#FCF3CF' }; // Cream for light mode

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        shadowColor: isDark ? colors.accent : colors.primary,
      }
    ]}>
      {errorMessage && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errorMessage}
        </Text>
      )}
      <div style={{ width: boardWidth, height: boardWidth }}>
        <Chessboard
          id="BasicBoard"
          boardWidth={boardWidth}
          position={game.fen()}
          onPieceDrop={onDrop}
          customDarkSquareStyle={darkSquareStyle}
          customLightSquareStyle={lightSquareStyle}
          boardOrientation="white"
          showBoardNotation={false}
        />
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorText: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
}); 