import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Chessboard from 'react-native-chessboard';
import { Chess, Square } from 'chess.js';
import { loadSounds, playSound, unloadSounds } from '../../../utils/sounds';

export const MobileChessBoard = () => {
  const [game, setGame] = useState(new Chess());

  // Load sounds on mount
  useEffect(() => {
    const initSounds = async () => {
      console.log('Initializing sounds...');
      await loadSounds();
    };
    initSounds();
    return () => {
      console.log('Cleaning up sounds...');
      unloadSounds();
    };
  }, []);

  const makeMove = async (moveInfo: any) => {
    try {
      console.log('Received move info:', moveInfo);
      
      // Extract move information
      const from = moveInfo.from || moveInfo.moveFrom || (moveInfo.move && moveInfo.move.from);
      const to = moveInfo.to || moveInfo.moveTo || (moveInfo.move && moveInfo.move.to);

      console.log('Processing move:', { from, to });

      // Create a new game instance and make the move
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: from as Square,
        to: to as Square,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move) {
        console.log('Move made:', move);
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

  return (
    <View style={styles.container}>
      <Chessboard
        gestureEnabled={true}
        onMove={makeMove}
        durations={{ move: 200 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
}); 