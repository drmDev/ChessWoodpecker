import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
      payload: [] 
    });
    playSound('success');
  };
  
  const handleEndSession = () => {
    dispatch({ type: 'END_SESSION' });
    playSound('move');
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {!isActive ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleStartSession}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.buttonText}>Start Session</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.error }]}
          onPress={handleEndSession}
        >
          <Ionicons name="stop" size={20} color="white" />
          <Text style={styles.buttonText}>End Session</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 180,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
}); 