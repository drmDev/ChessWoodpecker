import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { TurnIndicator } from '../components/chess/mobile/TurnIndicator';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { puzzleService } from '../services/PuzzleService';
import { playSound, SoundTypes } from '../utils/sounds';
import { SessionStatusBar } from '../components/session/SessionStatusBar';
import { sharedStyles } from '../styles/shared';
import { SEMANTIC_COLORS } from '../constants/colors';

export const MainScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state, dispatch } = useAppState();
    const [isPuzzleSetupComplete, setIsPuzzleSetupComplete] = useState(false);
    const [isTransitioningToPuzzle, setIsTransitioningToPuzzle] = useState(false);
    const [isInteractingWithBoard, setIsInteractingWithBoard] = useState(false);
    
    // Simplified puzzle state
    const isPuzzleActive = !!state.currentPuzzle;

    // Fetch the next puzzle from the session
    const handleFetchNewPuzzle = async () => {
        console.log('Fetching New Puzzle:', {
            currentPuzzleId: state.currentPuzzle?.id,
            isTransitioning: isTransitioningToPuzzle,
            remainingPuzzles: puzzleService.getRemainingPuzzleCount()
        });
        
        try {
            setIsTransitioningToPuzzle(true);
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // Get the next puzzle from the session
            const puzzle = await puzzleService.getNextPuzzle();
            
            if (puzzle) {
                dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
            } else {
                // No more puzzles in the session
                console.log('No more puzzles in session');
                // Reset UI state
                setIsPuzzleSetupComplete(false);
                // Could show a "session complete" message here
            }
        } catch (error) {
            console.error('Failed to fetch new puzzle:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // THIS IS ONLY FOR DEBUGGING PURPOSES
    // Add this effect to monitor puzzle transitions
    useEffect(() => {
        if (state.currentPuzzle) {
            console.log('Puzzle Transition:', {
                puzzleId: state.currentPuzzle.id,
                isLoading: state.isLoading,
                isTransitioning: isTransitioningToPuzzle,
                isPuzzleSetupComplete
            });
        }
    }, [state.currentPuzzle, state.isLoading, isTransitioningToPuzzle, isPuzzleSetupComplete]);

    // Puzzle game state and actions
    const {
        currentPosition,
        currentMoveIndex,
        isOpponentMoving,
        lastMoveFrom,
        lastMoveTo,
        isUserTurn,
        isGameOver,
        isAutoSolving,
        handleMove,
        resetGame,
        makeOpponentMove,
        autoSolvePuzzle,
        puzzleSetupState
    } = usePuzzleGame(handleFetchNewPuzzle);

    // Show loading overlay in these cases:
    // 1. During initial session start or between puzzles (isTransitioningToPuzzle)
    // 2. When puzzle is not fully set up yet
    // 3. During reset and auto-solve states
    // 4. But only if a session is active
    const shouldShowLoadingOverlay = (
        isPuzzleActive && (
            state.isLoading || 
            puzzleSetupState === 'PRE_SETUP' ||
            puzzleSetupState === 'SETUP_IN_PROGRESS'
        )
    ) && !isAutoSolving;

    // Determine the appropriate loading message
    const getLoadingMessage = () => {
        if (state.isLoading) return 'Loading next puzzle...';
        
        if (state.puzzleTransitionState === 'RESETTING') {
            return 'Incorrect move - Resetting puzzle...';
        }
        
        if (state.puzzleTransitionState === 'AUTO_SOLVING') {
            return 'Watch the solution...';
        }
        
        switch (puzzleSetupState) {
            case 'PRE_SETUP':
                return 'Preparing puzzle...';
            case 'SETUP_IN_PROGRESS':
                return 'Setting up board position...';
            default:
                return 'Loading...';
        }
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

    const handleStartPuzzles = async () => {
        try {
            await playSound(SoundTypes.START_SESSION);
            setIsPuzzleSetupComplete(false);
            setIsTransitioningToPuzzle(true);
            dispatch({ type: 'SET_LOADING', payload: true });

            // Reset elapsed time when starting a new session
            dispatch({ type: 'SET_ELAPSED_TIME', payload: 0 });
            
            // Initialize puzzles
            puzzleService.initializeRandomPuzzles();
            
            // Get the first puzzle
            const puzzle = await puzzleService.getNextPuzzle();
            if (puzzle) {
                dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
            } else {
                throw new Error('Failed to get first puzzle');
            }
        } catch (error) {
            console.error('Failed to start puzzles:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ErrorBoundary>
                {/* Add header bar when puzzle is active */}
                {isPuzzleActive && (
                    <SessionStatusBar
                        onEndSession={() => {
                            // play end session sound
                            playSound(SoundTypes.END_SESSION);
                            // reset puzzle state
                            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: null as any});
                            setIsPuzzleSetupComplete(false);
                            // end session
                            puzzleService.resetPuzzleIndex();
                            // Reset timer
                            dispatch({ type: 'SET_ELAPSED_TIME', payload: 0 });
                        }}
                    />
                )}

                <ScrollView 
                    contentContainerStyle={styles.contentContainer}
                    style={styles.content}
                >
                    {isPuzzleActive && puzzleSetupState === 'SETUP_COMPLETE' && (
                        <View style={styles.boardContainer}>
                            <TurnIndicator isWhiteToMove={state.currentPuzzle?.isWhiteToMove || false} />
                            <OrientableChessBoard
                                initialFen={currentPosition || undefined}
                                orientation={state.currentPuzzle?.isWhiteToMove ? 'white' : 'black'}
                                onMove={!isAutoSolving ? handleMove : undefined}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                showCoordinates={true}
                            />
                        </View>
                    )}
                    
                    {!isPuzzleActive && (
                        <TouchableOpacity
                            style={[sharedStyles.welcomeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                            <Text style={[sharedStyles.welcomeTitle, { color: theme.text }]}>
                                Welcome to Chess Woodpecker!
                            </Text>
                            <Text style={[sharedStyles.welcomeText, { color: theme.textSecondary }]}>
                                Start solving puzzles to improve your chess skills and have fun!
                            </Text>
                            
                            <TouchableOpacity
                                style={[sharedStyles.actionButton, { backgroundColor: theme.primary }]}
                                onPress={handleStartPuzzles}
                            >
                                <Text style={sharedStyles.actionButtonText}>Start Puzzles</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                </ScrollView>
                
                {/* Loading overlay for puzzle transitions */}
                <LoadingOverlay 
                    visible={shouldShowLoadingOverlay}
                    message={getLoadingMessage()}
                    setupState={puzzleSetupState}
                />
            </ErrorBoundary>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
    },
    boardContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
});
