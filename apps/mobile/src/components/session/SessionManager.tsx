import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppState } from '../../contexts/AppStateContext';
import { timerService } from '../../services/TimerService';
import { puzzleService } from '../../services/PuzzleService';
import { Ionicons } from '@expo/vector-icons';
import { playSound } from '../../utils/sounds';
import { Puzzle } from '../../models/PuzzleModel';

// Session state type
export type SessionState = 'idle' | 'active' | 'paused';

// Session data interface
export interface SessionData {
  startTime: number | null;
  elapsedTime: number;
  state: SessionState;
  currentPuzzle: Puzzle | null;
  isLoading: boolean;
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
  const handleStartSession = async () => {
    try {
      const puzzle = await puzzleService.fetchRandomPuzzle();
      dispatch({ 
        type: 'START_SESSION', 
        payload: {
          startTime: Date.now(),
          elapsedTime: 0,
          state: 'active',
          currentPuzzle: puzzle,
          isLoading: false
        }
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };
  
  const handleEndSession = () => {
    dispatch({ type: 'END_SESSION' });
  };

  // Show debug info for solution
  const renderDebugInfo = () => {
    if (!sessionData?.currentPuzzle) return null;
    
    return (
      <View style={styles.debugInfo}>
        <Text style={[styles.debugText, { color: theme.textSecondary }]}>
          Debug - Solution: {sessionData.currentPuzzle.solutionMovesUCI.join(', ')}
        </Text>
      </View>
    );
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
        <View>
          {sessionData.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>Loading puzzle...</Text>
            </View>
          ) : (
            <>
              {renderDebugInfo()}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.error }]}
                onPress={handleEndSession}
              >
                <Ionicons name="stop" size={20} color="white" />
                <Text style={styles.buttonText}>End Session</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
    padding: 16,
  },
  debugInfo: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    marginBottom: 12,
    padding: 8,
  },
  debugText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
  },
  loadingText: {
    fontSize: 16,
    marginLeft: 8,
  },
}); 