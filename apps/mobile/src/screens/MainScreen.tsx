import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { SessionManager } from '../components/session/SessionManager';
import { useTheme } from '../contexts/ThemeContext';
import { SessionStats } from '../components/session/SessionStats';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';

/**
 * Error boundary component to catch rendering errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Silently handle errors
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={styles.errorHint}>Please try again later.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

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
          {isSessionActive && (
            <View style={styles.boardContainer}>
              <OrientableChessBoard 
                orientation="white"
                showCoordinates={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#e74c3c',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#2c3e50',
  },
  errorHint: {
    fontSize: 14,
    color: '#7f8c8d',
  },
}); 