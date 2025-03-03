import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { formatTimeHHMMSS } from '../../utils/timeUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppState } from '../../contexts/AppStateContext';
import { timerService } from '../../services/TimerService';
import { Ionicons } from '@expo/vector-icons';
import { playSound } from '../../utils/sounds';

// Session state type
export type SessionState = 'idle' | 'active' | 'paused';

// Session data interface
export interface SessionData {
  startTime: number | null;
  elapsedTime: number;
  state: SessionState;
}

export const SessionManager: React.FC = () => {
  // Get state and dispatch from context
  const { state, dispatch } = useAppState();
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  
  // Extract session data from state
  const sessionData = state.sessionData;
  const isActive = sessionData !== null;
  
  // Set up the dispatch function for the timer service
  useEffect(() => {
    timerService.setDispatch(dispatch);
    return () => timerService.cleanup();
  }, [dispatch]);
  
  // Control the timer based on session state
  useEffect(() => {
    if (isActive) {
      timerService.start();
    } else {
      timerService.stop();
    }
  }, [isActive]);
  
  // Handle session actions
  const handleStartSession = () => {
    dispatch({ 
      type: 'START_SESSION', 
      payload: [
        // Sample puzzles - in a real app, these would come from a service
        {
          id: '12345',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          pgn: '',
          moves: ['e2e4', 'e7e5', 'g1f3'],
          rating: 1500,
          themes: ['opening'],
          gameUrl: 'https://lichess.org/training/12345'
        }
      ] 
    });
    playSound('success');
  };
  
  const handleEndSession = () => {
    dispatch({ type: 'END_SESSION' });
    playSound('move');
  };
  
  // Format the elapsed time
  const formattedTime = formatTimeHHMMSS(sessionData?.elapsedTime || 0);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: theme.text }]}>
          {formattedTime}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {!isActive ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleStartSession}
          >
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.buttonText}>Start Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.error }]}
            onPress={handleEndSession}
          >
            <Ionicons name="stop" size={24} color="white" />
            <Text style={styles.buttonText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 