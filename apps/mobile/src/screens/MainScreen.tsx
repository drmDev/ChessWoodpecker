import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { TurnIndicator } from '../components/chess/mobile/TurnIndicator';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { SessionStatusBar } from '../components/session/SessionStatusBar';
import { puzzleService } from '../services/PuzzleService';
import { playSound, SoundTypes } from '../utils/sounds';

export const MainScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state, dispatch } = useAppState();
    const [isPuzzleSetupComplete, setIsPuzzleSetupComplete] = useState(false);
    const [isTransitioningToPuzzle, setIsTransitioningToPuzzle] = useState(false);
    const [_, setIsInteractingWithBoard] = useState(false);
    
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
        isAutoSolving
    } = usePuzzleGame(handleFetchNewPuzzle);

    // Show loading overlay in these cases:
    // 1. During initial session start or between puzzles (isTransitioningToPuzzle)
    // 2. When puzzle is not fully set up yet
    // 3. But only if a session is active
    const shouldShowLoadingOverlay = ((state.isLoading || isTransitioningToPuzzle || !isPuzzleSetupComplete) && state.isSessionActive) && !isAutoSolving;

    // Determine the appropriate loading message
    const getLoadingMessage = () => {
        if (isTransitioningToPuzzle) return 'Loading next puzzle...';
        return 'Setting up puzzle...';
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

    const handleResumeSession = () => {
        dispatch({ type: 'RESUME_SESSION' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ErrorBoundary>
                {isSessionActive && (
                    <SessionStatusBar />
                )}
                
                <ScrollView 
                    contentContainerStyle={styles.contentContainer}
                    style={styles.content}
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
                            <>
                                <TouchableOpacity 
                                    style={[styles.button, { backgroundColor: theme.primary }]} 
                                    onPress={handleStartSession}
                                    disabled={state.isLoading}
                                >
                                    <Text style={styles.buttonText}>
                                        {state.isLoading ? 'Loading...' : 'Start New Session'}
                                    </Text>
                                </TouchableOpacity>
                                
                                {/* Show Resume button if there's a paused session */}
                                {state.session.isPaused && (
                                    <TouchableOpacity 
                                        style={[styles.button, { backgroundColor: theme.secondary, marginTop: 12 }]} 
                                        onPress={handleResumeSession}
                                    >
                                        <Text style={styles.buttonText}>Resume Session</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : null}
                    </View>
                </ScrollView>
                
                {/* Loading overlay for puzzle transitions */}
                <LoadingOverlay 
                    visible={shouldShowLoadingOverlay} 
                    message={getLoadingMessage()}
                />
            </ErrorBoundary>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    boardContainer: {
        alignItems: 'center',
        padding: 16,
    },
    button: {
        alignItems: 'center',
        borderRadius: 8,
        minWidth: 200,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    buttonContainer: {
        alignItems: 'center',
        padding: 16,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
    },
    welcomeContainer: {
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        margin: 16,
        padding: 24,
    },
    welcomeText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
});