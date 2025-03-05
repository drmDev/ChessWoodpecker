import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { SessionManager } from '../components/session/SessionManager';
import { useTheme } from '../contexts/ThemeContext';
import { SessionStats } from '../components/session/SessionStats';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

/**
 * MainScreen that displays a custom chessboard with orientation support
 */
export const MainScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state } = useAppState();
  const isSessionActive = state.sessionData !== null;
  const [isInteractingWithBoard, setIsInteractingWithBoard] = useState(false);

  const handleDragStart = () => {
    setIsInteractingWithBoard(true);
  };

  const handleDragEnd = () => {
    setIsInteractingWithBoard(false);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ErrorBoundary>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          scrollEnabled={!isInteractingWithBoard}
        >
          {isSessionActive && state.sessionData?.currentPuzzle && !state.sessionData?.isLoading && (
            <View style={styles.boardContainer}>
              <OrientableChessBoard 
                orientation={state.sessionData.currentPuzzle.isWhiteToMove ? 'white' : 'black'}
                showCoordinates={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                initialFen={state.sessionData.currentPuzzle.fen}
              />
            </View>
          )}
          
          {!isSessionActive && (
            <View style={[styles.welcomeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome to Chess Woodpecker</Text>
              <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
                Click "Start Session" below to begin practicing chess puzzles.
              </Text>
            </View>
          )}
          
          <SessionManager />
          {isSessionActive && <SessionStats />}
        </ScrollView>
      </ErrorBoundary>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  errorHint: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  errorText: {
    color: '#2c3e50',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#e74c3c',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 