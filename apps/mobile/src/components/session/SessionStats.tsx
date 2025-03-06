import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTimeHHMMSS } from '../../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../../styles/common';
import { typography } from '../../styles/typography';
import { useSessionStats } from '../../hooks/useSessionStats';

/**
 * Displays session statistics including elapsed time
 * Pure presentational component with business logic extracted to useSessionStats hook
 */
export const SessionStats: React.FC = () => {
  const { theme } = useTheme();
  const { isActive, elapsedTime, isCollapsed, toggleCollapsed } = useSessionStats();

  if (!isActive) return null;

  return (
    <View style={[commonStyles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={toggleCollapsed}
        activeOpacity={0.7}
      >
        <View style={commonStyles.row}>
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={theme.primary} 
            style={commonStyles.icon} 
          />
          <Text style={[typography.subtitle, { color: theme.text }]}>Session Timer</Text>
        </View>
        <Ionicons 
          name={isCollapsed ? "chevron-down" : "chevron-up"} 
          size={20} 
          color={theme.textSecondary} 
        />
      </TouchableOpacity>
      
      {!isCollapsed && (
        <View style={styles.statsContainer}>
          <View style={[commonStyles.row, styles.timerContainer]}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={theme.primary} 
              style={commonStyles.icon} 
            />
            <Text style={[styles.timerText, { color: theme.text }]}>
              {formatTimeHHMMSS(elapsedTime)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Component-specific styles
const styles = StyleSheet.create({
  headerContainer: {
    ...commonStyles.rowSpaceBetween,
    padding: 12,
  },
  statsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  timerContainer: {
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 16,
  },
  timerText: {
    ...typography.monospace,
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 