import React from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { SessionManager } from '../components/session/SessionManager';
import { ChessBoard } from '../components/chess/ChessBoard';
import { useTheme } from '../contexts/ThemeContext';
import { SessionStats } from '../components/session/SessionStats';
import { useAppState } from '../contexts/AppStateContext';

export const MainScreen: React.FC = () => {
  const { theme, themeMode } = useTheme();
  const { state } = useAppState();
  const isDark = themeMode === 'dark';
  const isSessionActive = state.sessionData !== null;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Main content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Chess board container - only show when session is active */}
        {isSessionActive && (
          <View style={styles.boardContainer}>
            <ChessBoard isDark={isDark} />
          </View>
        )}
        
        {/* Welcome message when no session is active */}
        {!isSessionActive && (
          <View style={[styles.welcomeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome to Chess Woodpecker</Text>
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
              Click "Start Session" below to begin practicing chess puzzles.
            </Text>
          </View>
        )}
        
        {/* Session controls */}
        <View style={styles.controlsContainer}>
          {/* Session manager */}
          <SessionManager />
          
          {/* Session stats */}
          <SessionStats />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  boardContainer: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    alignSelf: 'center',
  },
  controlsContainer: {
    marginTop: 8,
  },
  welcomeContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    marginVertical: 48,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 