import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppState } from '../../contexts/AppStateContext';
import { formatTimeHHMMSS } from '../../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';

export const SessionStats: React.FC = () => {
  const { state } = useAppState();
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Extract session data from state
  const sessionData = state.sessionData;
  
  // Calculate stats
  const elapsedTime = sessionData?.elapsedTime || 0;
  const puzzlesAttempted = sessionData ? 
    sessionData.solvedPuzzles.length + sessionData.failedPuzzles.length : 0;
  const puzzlesSolved = sessionData?.solvedPuzzles.length || 0;
  
  // Calculate success rate
  const successRate = puzzlesAttempted > 0 
    ? Math.round((puzzlesSolved / puzzlesAttempted) * 100) 
    : 0;

  // If no session is active, don't show anything
  if (!sessionData) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <Ionicons 
            name="stats-chart" 
            size={20} 
            color={theme.primary} 
            style={styles.icon} 
          />
          <Text style={[styles.title, { color: theme.text }]}>Session Statistics</Text>
        </View>
        <Ionicons 
          name={isCollapsed ? "chevron-down" : "chevron-up"} 
          size={20} 
          color={theme.textSecondary} 
        />
      </TouchableOpacity>
      
      {!isCollapsed && (
        <View style={styles.statsContainer}>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={20} color={theme.primary} style={styles.icon} />
            <Text style={[styles.timerText, { color: theme.text }]}>
              {formatTimeHHMMSS(elapsedTime)}
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statsGrid: {
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