import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppState } from '../../contexts/AppStateContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { playSound, SoundTypes } from '../../utils/sounds';
import { puzzleService } from '../../services/PuzzleService';

export const SessionStatusBar: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  // Use the session state directly
  const { session } = state;
  
  // Calculate remaining puzzles
  const remainingPuzzles = puzzleService.getRemainingPuzzleCount();
  const completedPuzzles = 200 - remainingPuzzles;
  
  const handleEndSession = () => {
    playSound(SoundTypes.END_SESSION);
    dispatch({ type: 'END_SESSION' });
    navigation.navigate('Stats' as never);
  };
  
  // Check if session is active before rendering
  if (!session.isActive) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.mainBar}>
        <View style={styles.statusInfo}>
          <Text style={[styles.timeText, { color: theme.text }]}>
            Puzzle {completedPuzzles}/200
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.endButton, { backgroundColor: theme.error }]} 
          onPress={handleEndSession}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>End Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    marginBottom: 0,
    width: '100%',
    paddingVertical: 8,
  },
  mainBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  statusInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  timeText: {
    fontWeight: '500',
    fontSize: 16,
  },
  endButton: {
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  }
}); 