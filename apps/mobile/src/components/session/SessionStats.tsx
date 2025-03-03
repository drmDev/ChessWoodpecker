import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppState } from '../../contexts/AppStateContext';
import { formatTimeHHMMSS } from '../../utils/timeUtils';

export const SessionStats: React.FC = () => {
  const { state } = useAppState();
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  
  // Extract session data from state
  const sessionData = state.sessionData;
  
  // Calculate stats
  const elapsedTime = sessionData?.startTime ? Date.now() - sessionData.startTime : 0;
  const puzzlesAttempted = sessionData ? 
    sessionData.solvedPuzzles.length + sessionData.failedPuzzles.length : 0;
  const puzzlesSolved = sessionData?.solvedPuzzles.length || 0;
  
  // Calculate success rate
  const successRate = puzzlesAttempted > 0 
    ? Math.round((puzzlesSolved / puzzlesAttempted) * 100) 
    : 0;

  // If no session is active, show a message
  if (!sessionData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.noSessionText, { color: theme.textSecondary }]}>
          No active session. Start a session to see statistics.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Session Statistics</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Time</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{formatTimeHHMMSS(elapsedTime)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Puzzles</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{puzzlesAttempted}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Solved</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{puzzlesSolved}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Success</Text>
          <Text 
            style={[
              styles.statValue, 
              { 
                color: successRate >= 70 
                  ? theme.success 
                  : successRate >= 40 
                    ? theme.accent 
                    : theme.error 
              }
            ]}
          >
            {successRate}%
          </Text>
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  noSessionText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
}); 