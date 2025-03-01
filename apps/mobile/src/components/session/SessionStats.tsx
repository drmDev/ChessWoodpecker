import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SessionStats as SessionStatsType } from '../../services/SessionService';
import { formatTimeHHMMSS } from '../../utils/timeUtils';
import { useTheme } from '../../../../shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface SessionStatsProps {
  stats: SessionStatsType;
  currentSessionTime?: number; // Add prop for current session time
  hideTitle?: boolean; // Add prop to hide the title
}

export const SessionStats: React.FC<SessionStatsProps> = ({ 
  stats, 
  currentSessionTime = 0,
  hideTitle = false 
}) => {
  const { colors, isDark } = useTheme();
  
  // Woodpecker-inspired colors
  const headerColor = '#D32F2F'; // Woodpecker red
  const labelColors = {
    attempted: '#FF9800', // Orange
    solved: '#2196F3',    // Blue
    rate: '#9C27B0'       // Purple
  };
  
  // Matrix-like green color for the timer
  const timerColor = '#00FF41'; // Bright matrix green
  const timerGlowColor = isDark ? 'rgba(0, 255, 65, 0.3)' : 'rgba(0, 255, 65, 0.1)';
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        borderRightColor: headerColor,
        borderRightWidth: 4,
      }
    ]}>
      {/* Current session timer */}
      {currentSessionTime > 0 && (
        <View style={styles.timerContainer}>
          <Text style={[
            styles.timerText, 
            { 
              color: timerColor,
              // Use a web-compatible approach for shadows
              ...(Platform.OS === 'web' 
                ? { textShadow: `0px 0px 8px ${timerGlowColor}` } 
                : {
                    textShadowColor: timerGlowColor,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  }
              )
            }
          ]}>
            {formatTimeHHMMSS(currentSessionTime)}
          </Text>
        </View>
      )}
      
      {!hideTitle && (
        <View style={styles.titleContainer}>
          <Ionicons name="stats-chart" size={20} color={headerColor} style={styles.titleIcon} />
          <Text style={[styles.title, { color: headerColor }]}>Session Statistics</Text>
        </View>
      )}
      
      <View style={styles.divider} />
      
      <View style={styles.statRow}>
        <View style={styles.labelContainer}>
          <Ionicons name="flag-outline" size={18} color={labelColors.attempted} style={styles.labelIcon} />
          <Text style={[styles.statLabel, { color: labelColors.attempted }]}>Puzzles Attempted:</Text>
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{stats.puzzlesAttempted}</Text>
      </View>
      
      <View style={styles.statRow}>
        <View style={styles.labelContainer}>
          <Ionicons name="checkmark-circle-outline" size={18} color={labelColors.solved} style={styles.labelIcon} />
          <Text style={[styles.statLabel, { color: labelColors.solved }]}>Puzzles Solved:</Text>
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{stats.puzzlesSolved}</Text>
      </View>
      
      <View style={styles.statRow}>
        <View style={styles.labelContainer}>
          <Ionicons name="trending-up-outline" size={18} color={labelColors.rate} style={styles.labelIcon} />
          <Text style={[styles.statLabel, { color: labelColors.rate }]}>Success Rate:</Text>
        </View>
        <Text style={[
          styles.statValue, 
          { 
            color: getSuccessRateColor(stats.successRate, isDark),
            fontWeight: 'bold'
          }
        ]}>
          {stats.successRate.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
};

// Function to get color based on success rate
const getSuccessRateColor = (rate: number, isDark: boolean): string => {
  if (rate >= 80) return isDark ? '#66BB6A' : '#2E7D32'; // Green
  if (rate >= 60) return isDark ? '#FFB74D' : '#EF6C00'; // Orange
  if (rate >= 40) return isDark ? '#FFF176' : '#F9A825'; // Yellow
  return isDark ? '#EF5350' : '#C62828'; // Red
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 6,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 