import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { SessionManager } from '../components/session/SessionManager';
import { useTheme } from '../contexts/ThemeContext';
import { SessionStats } from '../components/session/SessionStats';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { PuzzleCacheService } from '../services/PuzzleCacheService';
import { puzzleService } from '../services/PuzzleService';
import { Ionicons } from '@expo/vector-icons';
import { usePuzzleGame } from '../hooks/usePuzzleGame';

// Only show debug buttons in development
const isDev = __DEV__;

const TurnIndicator: React.FC<{ isWhiteToMove: boolean }> = ({ isWhiteToMove }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.turnIndicator, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.turnIndicatorText, { color: theme.text }]}>
        {isWhiteToMove ? "White" : "Black"} to move
      </Text>
    </View>
  );
};

/**
 * MainScreen that displays a custom chessboard with orientation support
 */
export const MainScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state, dispatch } = useAppState();
  const isSessionActive = state.sessionData !== null;
  const [isInteractingWithBoard, setIsInteractingWithBoard] = useState(false);
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(true);
  
  // Use the puzzle game hook
  const { currentPosition, handleMove } = usePuzzleGame();

  const handleDragStart = () => {
    setIsInteractingWithBoard(true);
  };

  const handleDragEnd = () => {
    setIsInteractingWithBoard(false);
  };

  const handleClearCache = async () => {
    try {
      await PuzzleCacheService.clearCache();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleFetchNewPuzzle = async () => {
    try {
      if (!state.sessionData) {
        console.log('No active session');
        return;
      }
      const puzzle = await puzzleService.fetchRandomPuzzle();
      dispatch({ type: 'UPDATE_SESSION', payload: { currentPuzzle: puzzle } });
      console.log('Fetched new puzzle:', puzzle.id);
    } catch (error) {
      console.error('Failed to fetch new puzzle:', error);
    }
  };

  const renderDebugTools = () => {
    if (!isDev) return null;

    return (
      <View style={[styles.debugContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.headerContainer}
          onPress={() => setIsDebugCollapsed(!isDebugCollapsed)}
          activeOpacity={0.7}
        >
          <View style={styles.titleContainer}>
            <Ionicons 
              name="bug-outline" 
              size={20} 
              color={theme.primary} 
              style={styles.icon} 
            />
            <Text style={[styles.title, { color: theme.text }]}>Debug Tools</Text>
          </View>
          <Ionicons 
            name={isDebugCollapsed ? "chevron-down" : "chevron-up"} 
            size={20} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>
        
        {!isDebugCollapsed && (
          <View style={styles.debugButtonsContainer}>
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: theme.primary }]}
              onPress={handleFetchNewPuzzle}
            >
              <Text style={styles.debugButtonText}>Fetch New Puzzle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: theme.error }]}
              onPress={handleClearCache}
            >
              <Text style={styles.debugButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
              <TurnIndicator isWhiteToMove={state.sessionData.currentPuzzle.isWhiteToMove} />
              <OrientableChessBoard 
                orientation={state.sessionData.currentPuzzle.isWhiteToMove ? 'white' : 'black'}
                showCoordinates={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMove={handleMove}
                initialFen={currentPosition || state.sessionData.currentPuzzle.fen}
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
          {renderDebugTools()}
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
    padding: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  debugContainer: {
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
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugButtonsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  debugButton: {
    borderRadius: 8,
    padding: 12,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 24,
  },
  subText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  turnIndicator: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  turnIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 