import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SessionManager } from '../components/session/SessionManager';
import { ChessBoard } from '../components/chess/ChessBoard';
import { useTheme } from '../contexts/ThemeContext';
import { SessionStats } from '../components/session/SessionStats';

export const MainScreen: React.FC = () => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Chess Woodpecker</Text>
      </View>
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Session manager */}
        <SessionManager />
        
        {/* Session stats */}
        <SessionStats />
        
        {/* Chess board container */}
        <View style={styles.boardContainer}>
          <ChessBoard isDark={isDark} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
}); 