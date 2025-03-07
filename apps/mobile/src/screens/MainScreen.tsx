import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { TurnIndicator } from '../components/chess/mobile/TurnIndicator';
import { SessionManager } from '../components/session/SessionManager';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { puzzleService } from '../services/PuzzleService';
import { PuzzleCacheDebug } from '../components/debug/PuzzleCacheDebug';

export const MainScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state, dispatch } = useAppState();
    const [isInteractingWithBoard, setIsInteractingWithBoard] = useState(false);
    
    const isSessionActive = !state.sessionStats.isCurrentSessionPaused() && state.currentPuzzle !== null;
    
    const handleFetchNewPuzzle = async () => {
        try {
            const currentPuzzle = state.currentPuzzle;
            console.log('[MainScreen] Attempting to fetch new puzzle:', {
                currentPuzzleId: currentPuzzle?.id || 'none',
                sessionActive: isSessionActive
            });
            
            if (!currentPuzzle) {
                console.log('[MainScreen] Cannot fetch new puzzle: no active session');
                return;
            }
            dispatch({ type: 'SET_LOADING', payload: true });
            const puzzle = await puzzleService.fetchRandomPuzzle();
            console.log('[MainScreen] Successfully fetched new puzzle:', {
                id: puzzle.id,
                fen: puzzle.fen
            });
            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
        } catch (error) {
            console.error('[MainScreen] Failed to fetch new puzzle:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const { 
        currentPosition, 
        handleMove, 
        isOpponentMoving,
        makeOpponentMove,
        onPuzzleComplete,
        isUserTurn,
        isGameOver,
        isAutoSolving
    } = usePuzzleGame(handleFetchNewPuzzle);

    useEffect(() => {
        console.log('[MainScreen] Screen state updated:', {
            sessionActive: isSessionActive,
            isLoading: state.isLoading,
            boardInteractive: !isAutoSolving && !isOpponentMoving,
            currentPuzzleId: state.currentPuzzle?.id || 'none'
        });
    }, [isSessionActive, state.isLoading, isAutoSolving, isOpponentMoving, state.currentPuzzle]);

    const handleDragStart = () => {
        if (!isAutoSolving && !isOpponentMoving) {
            setIsInteractingWithBoard(true);
        }
    };

    const handleDragEnd = () => {
        if (!isAutoSolving && !isOpponentMoving) {
            setIsInteractingWithBoard(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ErrorBoundary>
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={styles.contentContainer}
                    scrollEnabled={!isInteractingWithBoard}
                >
                    {isSessionActive && state.currentPuzzle && !state.isLoading && (
                        <View style={styles.boardContainer}>
                            <TurnIndicator isWhiteToMove={state.currentPuzzle.isWhiteToMove} />
                            <OrientableChessBoard
                                initialFen={currentPosition || undefined}
                                orientation={state.currentPuzzle.isWhiteToMove ? 'white' : 'black'}
                                onMove={!isAutoSolving ? handleMove : undefined}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                showCoordinates={true}
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
                    <PuzzleCacheDebug />
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
        flexGrow: 1,
    },
    boardContainer: {
        alignItems: 'center',
        padding: 16,
    },
    welcomeContainer: {
        margin: 16,
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
}); 