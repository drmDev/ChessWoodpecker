import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const { state, dispatch } = useAppState();
  const { theme } = useTheme();
  
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
    playSound('success');
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
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 