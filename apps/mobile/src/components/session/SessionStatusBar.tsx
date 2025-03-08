import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../../contexts/AppStateContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTimeHHMMSS } from '../../utils/timeUtils';
import { useNavigation } from '@react-navigation/native';
import { playSound, SoundTypes } from '../../utils/sounds';

export const SessionStatusBar: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { session } = state;
  const totalPuzzles = session.successfulPuzzles.length + session.failedPuzzles.length;
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handlePauseResume = () => {
    if (session.isPaused) {
      dispatch({ type: 'RESUME_SESSION' });
    } else {
      dispatch({ type: 'PAUSE_SESSION' });
    }
  };
  
  const handleViewStats = () => {
    navigation.navigate('Stats' as never);
  };
  
  const handleEndSession = () => {
    playSound(SoundTypes.END_SESSION);
    dispatch({ type: 'END_SESSION' });
    navigation.navigate('Stats' as never);
  };
  
  if (!session.isActive) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Main status bar - always visible */}
      <View style={styles.mainBar}>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: session.isPaused ? theme.error : theme.success }]}>
            {session.isPaused ? 'PAUSED' : 'ACTIVE'}
          </Text>
          <Text style={[styles.timeText, { color: theme.text }]}>
            {formatTimeHHMMSS(session.elapsedTimeMs)}
          </Text>
          <Text style={[styles.puzzleCountText, { color: theme.primary }]}>
            Puzzle {totalPuzzles}/200
          </Text>
        </View>
        
        <TouchableOpacity onPress={toggleExpanded} style={styles.expandButton}>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.text} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Expanded controls - only visible when expanded */}
      {isExpanded && (
        <View style={[styles.expandedControls, { backgroundColor: theme.surface }]}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: session.isPaused ? theme.primary : theme.warning }]} 
            onPress={handlePauseResume}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>
              {session.isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.secondary }]} 
            onPress={handleViewStats}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.error }]} 
            onPress={handleEndSession}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>End</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  container: {
    borderBottomWidth: 1,
    marginBottom: 8,
    width: '100%',
  },
  controlButton: {
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expandButton: {
    padding: 4,
  },
  expandedControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mainBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  puzzleCountText: {
    fontSize: 12,
  },
  statusInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusText: {
    fontWeight: 'bold',
    marginRight: 12,
  },
  timeText: {
    fontWeight: '500',
    marginRight: 12,
  },
}); 