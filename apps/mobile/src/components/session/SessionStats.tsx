import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
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
            name="time-outline" 
            size={20} 
            color={theme.primary} 
            style={styles.icon} 
          />
          <Text style={[styles.title, { color: theme.text }]}>Session Timer</Text>
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  icon: {
    marginRight: 8,
  },
  statsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  timerContainer: {
    alignItems: 'center',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
  },
  timerText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  }
}); 