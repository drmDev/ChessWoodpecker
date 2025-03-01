import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { formatTimeHHMMSS } from '../../utils/timeUtils';
import { useTheme } from '../../../../shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Session state type
export type SessionState = 'idle' | 'active' | 'paused';

// Session data interface
export interface SessionData {
  startTime: number | null;
  elapsedTime: number;
  state: SessionState;
}

interface SessionManagerProps {
  onSessionUpdate?: (sessionData: SessionData) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ onSessionUpdate }) => {
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { colors, isDark } = useTheme();
  
  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to store the latest session data
  const sessionDataRef = useRef<SessionData>({
    startTime: null,
    elapsedTime: 0,
    state: 'idle'
  });
  
  // Update the ref whenever session data changes
  useEffect(() => {
    sessionDataRef.current = {
      startTime,
      elapsedTime,
      state: sessionState
    };
  }, [startTime, elapsedTime, sessionState]);
  
  // Notify parent component of session updates, but only when explicitly called
  const notifySessionUpdate = () => {
    if (onSessionUpdate) {
      onSessionUpdate(sessionDataRef.current);
    }
  };
  
  // Start session
  const startSession = () => {
    if (sessionState === 'idle') {
      // New session
      setStartTime(Date.now());
      setElapsedTime(0);
      setSessionState('active');
    } else if (sessionState === 'paused') {
      // Resume session
      setStartTime(Date.now() - elapsedTime);
      setSessionState('active');
    }
    
    // Schedule a notification after state updates
    setTimeout(notifySessionUpdate, 0);
  };
  
  // Pause session
  const pauseSession = () => {
    if (sessionState === 'active') {
      const currentElapsed = startTime ? Date.now() - startTime : 0;
      setElapsedTime(currentElapsed);
      setSessionState('paused');
      
      // Schedule a notification after state updates
      setTimeout(notifySessionUpdate, 0);
    }
  };
  
  // Reset session
  const resetSession = () => {
    setSessionState('idle');
    setElapsedTime(0);
    setStartTime(null);
    
    // Schedule a notification after state updates
    setTimeout(notifySessionUpdate, 0);
  };
  
  // Update timer
  useEffect(() => {
    if (sessionState === 'active') {
      // Start timer that updates every 10ms
      timerRef.current = setInterval(() => {
        if (startTime) {
          const currentElapsed = Date.now() - startTime;
          setElapsedTime(currentElapsed);
        }
      }, 10);
    } else {
      // Clear timer when not active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState, startTime]);
  
  // Notify about timer updates less frequently
  useEffect(() => {
    if (sessionState === 'active') {
      const notificationTimer = setInterval(() => {
        notifySessionUpdate();
      }, 1000); // Update parent only once per second
      
      return () => clearInterval(notificationTimer);
    }
  }, [sessionState]);

  // Matrix-like green color for the timer
  const timerColor = '#00FF41'; // Bright matrix green
  const timerGlowColor = isDark ? 'rgba(0, 255, 65, 0.3)' : 'rgba(0, 255, 65, 0.1)';
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        borderLeftColor: colors.accent,
        borderLeftWidth: 4,
      }
    ]}>
      {/* Timer removed from here and moved to SessionStats */}
      
      <View style={styles.buttonContainer}>
        {sessionState === 'idle' && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.secondary }]} 
            onPress={startSession}
          >
            <Ionicons name="play" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Session</Text>
          </TouchableOpacity>
        )}
        
        {sessionState === 'active' && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={pauseSession}
          >
            <Ionicons name="pause" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Pause Session</Text>
          </TouchableOpacity>
        )}
        
        {sessionState === 'paused' && (
          <>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.secondary }]} 
              onPress={startSession}
            >
              <Ionicons name="play" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.error }]} 
              onPress={resetSession}
            >
              <Ionicons name="refresh" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>New Session</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 