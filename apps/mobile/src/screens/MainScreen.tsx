import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { TurnIndicator } from '../components/chess/mobile/TurnIndicator';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { puzzleService } from '../services/PuzzleService';
import { PuzzleCacheDebug } from '../components/debug/PuzzleCacheDebug';
import { playSound, SoundTypes } from '../utils/sounds';

export const MainScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state, dispatch } = useAppState();
    const [isInteractingWithBoard, setIsInteractingWithBoard] = useState(false);
    const [isPuzzleSetupComplete, setIsPuzzleSetupComplete] = useState(false);
    const [isTransitioningToPuzzle, setIsTransitioningToPuzzle] = useState(false);
    
    const isSessionActive = state.isSessionActive && state.currentPuzzle !== null;
    
    const handleFetchNewPuzzle = async () => {
        try {
            const currentPuzzle = state.currentPuzzle;
            if (!currentPuzzle) {
                return;
            }
            
            // Start transition to new puzzle
            setIsTransitioningToPuzzle(true);
            setIsPuzzleSetupComplete(false);
            
            dispatch({ type: 'SET_LOADING', payload: true });
            const puzzle = await puzzleService.fetchRandomPuzzle();
            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
        } catch (error) {
            console.error('Failed to fetch new puzzle:', error);
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

    // Show loading overlay in these cases:
    // 1. During initial session start or between puzzles (isTransitioningToPuzzle)
    // 2. When puzzle is not fully set up yet
    // 3. But only if a session is active
    const showLoadingOverlay = ((state.isLoading || isTransitioningToPuzzle || !isPuzzleSetupComplete) && state.isSessionActive) && !isAutoSolving;

    // Determine the appropriate loading message
    const getLoadingMessage = () => {
        if (isTransitioningToPuzzle) return "Loading next puzzle...";
        return "Setting up puzzle...";
    };

    // When currentPosition changes, it means the puzzle is set up
    useEffect(() => {
        if (currentPosition && state.currentPuzzle) {
            // Add a small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setIsPuzzleSetupComplete(true);
                setIsTransitioningToPuzzle(false);
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [currentPosition, state.currentPuzzle]);

    // Reset puzzle setup state when session ends
    useEffect(() => {
        if (!state.isSessionActive) {
            setIsPuzzleSetupComplete(false);
            setIsTransitioningToPuzzle(false);
        }
    }, [state.isSessionActive]);

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

    const handleStartSession = async () => {
        try {
            await playSound(SoundTypes.START_SESSION);
            setIsPuzzleSetupComplete(false);
            setIsTransitioningToPuzzle(true);
            dispatch({ type: 'START_SESSION' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const puzzle = await puzzleService.fetchRandomPuzzle();
            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
        } catch (error) {
            console.error('Failed to start session:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleEndSession = async () => {
        try {
            await playSound(SoundTypes.END_SESSION);
            dispatch({ type: 'END_SESSION' });
        } catch (error) {
            console.error('Failed to end session:', error);
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
                    {isSessionActive && state.currentPuzzle && (
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
                    
                    <View style={styles.buttonContainer}>
                        {!isSessionActive ? (
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: theme.primary }]} 
                                onPress={handleStartSession}
                                disabled={state.isLoading}
                            >
                                <Text style={styles.buttonText}>
                                    {state.isLoading ? 'Loading...' : 'Start Session'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: theme.error }]} 
                                onPress={handleEndSession}
                            >
                                <Text style={styles.buttonText}>End Session</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <PuzzleCacheDebug />
                </ScrollView>
                
                {/* Loading overlay for puzzle transitions */}
                <LoadingOverlay 
                    visible={showLoadingOverlay} 
                    message={getLoadingMessage()}
                />
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
    buttonContainer: {
        padding: 16,
        alignItems: 'center',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});