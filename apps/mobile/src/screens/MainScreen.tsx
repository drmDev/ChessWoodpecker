import React from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView } from 'react-native';
import { SessionManager } from '../components/session/SessionManager';
import { ChessBoard } from '../components/chess/ChessBoard';
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
    console.error('MainScreen error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={styles.errorHint}>
            Check the console logs for more details.
          </Text>
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
  const { theme, themeMode } = useTheme();
  const { state } = useAppState();
  const isDark = themeMode === 'dark';
  const isSessionActive = state.sessionData !== null;
  
  const handleMove = (from: string, to: string) => {
    console.log(`Move from ${from} to ${to}`);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ErrorBoundary>
        {/* Main content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Chess board container - only show when session is active */}
          {isSessionActive && (
            <View style={styles.boardContainer}>
              <OrientableChessBoard 
                orientation="white"
                showCoordinates={true}
                onMove={handleMove}
              />
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
    padding: 8,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  boardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff0000',
    margin: 16,
    maxWidth: '90%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 8,
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14,
    marginBottom: 8,
  },
  errorHint: {
    color: '#666666',
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 