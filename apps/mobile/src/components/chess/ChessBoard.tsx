import React from 'react';
import { View, StyleSheet } from 'react-native';
import OrientableChessBoard from './mobile/OrientableChessBoard';

/**
 * ChessBoard component that adapts the old API to use the new OrientableChessBoard
 * This provides backward compatibility with existing code
 */
export const ChessBoard: React.FC<{ isDark?: boolean }> = ({ isDark }) => {
  // Simple adapter to convert between the old and new APIs
  return (
    <View style={styles.container}>
      <OrientableChessBoard 
        orientation="white"
        showCoordinates={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 