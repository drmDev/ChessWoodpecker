import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SessionManager, SessionData } from '../components/session/SessionManager';
import { ChessBoard } from '../components/chess/ChessBoard';
import { SessionStats } from '../components/session/SessionStats';
import { useTheme } from '../../../shared/contexts/ThemeContext';
import { getSessionStats, updateCurrentSession } from '../services/SessionService';
import { Ionicons } from '@expo/vector-icons';

export const MainScreen: React.FC = () => {
  const [sessionStats, setSessionStats] = useState(getSessionStats());
  const [statsVisible, setStatsVisible] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  // calculateBoardSize calculates the size of the board based on the width and height of the screen.  
  const calculateBoardSize = () => {
    // For web, use a percentage of the window width
    if (Platform.OS === 'web') {
      return Math.min(width * 0.8, 600);
    }
    
    // For mobile, use the smaller dimension minus some padding
    const smallerDimension = Math.min(width, height);
    return smallerDimension - 40; // 20px padding on each side
  };

  const boardSize = calculateBoardSize();

  // Handle session updates
  const handleSessionUpdate = (sessionData: SessionData) => {
    // Update the session service with the latest session data
    updateCurrentSession(sessionData);
    
    // Update the current session time
    setCurrentSessionTime(sessionData.elapsedTime);
    
    // Update the stats display
    setSessionStats(getSessionStats());
  };

  // Toggle stats visibility
  const toggleStats = () => {
    setStatsVisible(!statsVisible);
  };

  // Woodpecker-inspired colors for the stats header
  const headerColor = '#D32F2F'; // Woodpecker red

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[
          styles.boardContainer, 
          { 
            borderColor: colors.border,
            backgroundColor: isDark ? colors.highlight : colors.surface,
          }
        ]}>
          <ChessBoard />
        </View>
        
        <View style={styles.sessionManager}>
          <SessionManager onSessionUpdate={handleSessionUpdate} />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.statsHeader, 
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRightColor: headerColor,
              borderRightWidth: 4,
            }
          ]} 
          onPress={toggleStats}
        >
          <View style={styles.statsHeaderContent}>
            <Ionicons 
              name="stats-chart" 
              size={20} 
              color={headerColor} 
              style={styles.headerIcon} 
            />
            <Text style={[styles.statsHeaderText, { color: headerColor }]}>
              Session Statistics
            </Text>
            <Ionicons 
              name={statsVisible ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={headerColor} 
              style={{ marginLeft: 'auto' }}
            />
          </View>
        </TouchableOpacity>
        
        {statsVisible && (
          <View style={styles.sessionStats}>
            <SessionStats 
              stats={sessionStats} 
              currentSessionTime={currentSessionTime}
              hideTitle={true}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'visible',
  },
  sessionManager: {
    width: '90%',
    marginTop: 8,
    marginBottom: 8,
  },
  statsHeader: {
    width: '90%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  statsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  statsHeaderText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionStats: {
    width: '90%',
    marginBottom: 8,
  },
}); 