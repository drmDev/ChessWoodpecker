import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Chessboard, { ChessboardRef } from 'react-native-chessboard';
import { Chess } from 'chess.js';
import { playSound } from '../../utils/sounds';

interface ChessBoardProps {
  isDark?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ isDark = false }) => {
  const chessboardRef = useRef<ChessboardRef>(null);
  const [game] = React.useState(new Chess());
  
  // Calculate board size based on screen width
  const { width } = Dimensions.get('window');
  const boardSize = Math.min(width - 32, 350); // Use smaller of screen width or 350
  
  // Board colors based on theme
  const boardColors = {
    black: isDark ? '#1A5276' : '#1E8449', // Dark blue or forest green
    white: isDark ? '#D6EAF8' : '#FCF3CF', // Light blue or cream
  };
  
  const handleMove = ({ state }: any) => {
    console.log('Move detected');
    
    // Default to playing move sound
    let soundToPlay: 'move' | 'capture' | 'check' | 'success' = 'move';
    
    // Determine which sound to play based on the move
    if (state && state.in_check) {
      soundToPlay = 'check';
    } else if (state && state.in_checkmate) {
      soundToPlay = 'success';
    } else if (state && state.history && state.history.length > 0) {
      const lastMove = state.history[state.history.length - 1];
      if (lastMove && lastMove.captured) {
        soundToPlay = 'capture';
      }
    }
    
    // Play the sound
    console.log(`Playing sound: ${soundToPlay}`);
    playSound(soundToPlay);
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
        <Chessboard
          ref={chessboardRef}
          gestureEnabled={true}
          onMove={handleMove}
          durations={{ move: 200 }}
          colors={boardColors}
          boardSize={boardSize}
          fen={game.fen()}
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