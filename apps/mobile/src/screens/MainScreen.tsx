import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
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
import { Puzzle } from '../models/PuzzleModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MainScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state, dispatch } = useAppState();
    const [isPuzzleSetupComplete, setIsPuzzleSetupComplete] = useState(false);
    const [isTransitioningToPuzzle, setIsTransitioningToPuzzle] = useState(false);
    const [_, setIsInteractingWithBoard] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [debugPuzzleId, setDebugPuzzleId] = useState('');
    const [hasStoredSession, setHasStoredSession] = useState(false);

    const isSessionActive = state.isSessionActive && state.currentPuzzle !== null;

    // Add this useEffect to check for stored session on mount
    useEffect(() => {
        checkForStoredSession();
    }, []);

    const checkForStoredSession = async () => {
        try {
            const savedSession = await AsyncStorage.getItem('@chess_woodpecker/session');
            setHasStoredSession(!!savedSession);
        } catch (error) {
            console.error('Failed to check for stored session:', error);
        }
    };

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

    const handleFetchNewPuzzle = async () => {
        console.log('Fetching New Puzzle:', {
            currentPuzzleId: state.currentPuzzle?.id,
            isTransitioning: isTransitioningToPuzzle,
            remainingPuzzles: puzzleService.getRemainingPuzzleCount()
        });
        
        try {
            setIsTransitioningToPuzzle(true);
            setIsPuzzleSetupComplete(false);
            
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // Get the next puzzle from the session
            const puzzle = await puzzleService.getNextSessionPuzzle();
            
            if (!puzzle) {
                // If no more puzzles in the session, end the session
                console.log('No more puzzles in session. Session complete!');
                dispatch({ type: 'END_SESSION' });
                return;
            }
            
            console.log('New Puzzle Fetched:', {
                newPuzzleId: puzzle.id,
                fen: puzzle.fen,
                remainingPuzzles: puzzleService.getRemainingPuzzleCount()
            });
            
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
        isAutoSolving,
        puzzleSetupState
    } = usePuzzleGame(handleFetchNewPuzzle);

    // Show loading overlay in these cases:
    // 1. During initial session start or between puzzles (isTransitioningToPuzzle)
    // 2. When puzzle is not fully set up yet
    // 3. During reset and auto-solve states
    // 4. But only if a session is active
    const shouldShowLoadingOverlay = (
        state.isSessionActive && (
            state.isLoading || 
            puzzleSetupState === 'PRE_SETUP' ||
            puzzleSetupState === 'SETUP_IN_PROGRESS' ||
            state.puzzleTransitionState === 'RESETTING' ||
            state.puzzleTransitionState === 'AUTO_SOLVING'
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
            
            // Initialize the session with shuffled puzzles
            puzzleService.initializeSession();
            
            // Get the first puzzle from the session
            const puzzle = await puzzleService.getNextSessionPuzzle();
            if (puzzle) {
                dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
            } else {
                throw new Error('Failed to get first puzzle for session');
            }
        } catch (error) {
            console.error('Failed to start session:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleResumeSession = async () => {
        try {
            const savedSessionData = await AsyncStorage.getItem('@chess_woodpecker/session');
            if (savedSessionData) {
                const sessionState = JSON.parse(savedSessionData);
                dispatch({ type: 'LOAD_STORED_SESSION', payload: sessionState });
                
                // Initialize a new session with shuffled puzzles
                puzzleService.initializeSession();
                
                // Get the first puzzle from the session
                const puzzle = await puzzleService.getNextSessionPuzzle();
                if (puzzle) {
                    dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
                } else {
                    throw new Error('Failed to get first puzzle for resumed session');
                }
            }
        } catch (error) {
            console.error('Failed to resume session:', error);
        }
    };

    const handleClearSession = async () => {
        try {
            await AsyncStorage.removeItem('@chess_woodpecker/session');
            setHasStoredSession(false);
            console.log('Session cleared');
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    };

    // Load a specific puzzle for debugging
    const loadSpecificPuzzle = async () => {
        try {
            setIsTransitioningToPuzzle(true);
            setIsPuzzleSetupComplete(false);
            
            dispatch({ type: 'SET_LOADING', payload: true });

            // For now using hardcoded puzzle data structure
            // TODO: Replace with actual API call
            const puzzleData = {
                id: debugPuzzleId,
                pgn: 'e4 e5 Nf3 d6 Nc3 Bd7 Bc4 h6 d3 Nc6 Be3 a6 Qd2 Nf6 O-O-O Na5 h3 Be7 g4 Nxc4 dxc4 Nh7 Nd5 b5 Nxe7 Qxe7 Qd5 O-O Qb7 bxc4 Qxc7 Rfd8 Rxd6 Nf6 Rdd1 Nxe4 Nxe5 Rac8 Qb7 Qxe5 Rxd7 Rb8 Rxd8+ Rxd8 Qxa6 Nxf2 Bxf2 Qf4+ Kb1 Qxf2 Qxc4 Rd2 Rf1 Qa7 Qc8+ Kh7 Qf5+ Kg8 a3 Qe7 Qf4 Rd6 Qb4 Qd7 Qb8+ Kh7 Qb3 Re6 Qd3+ Qxd3 cxd3 Re3 Rd1 Rxh3 b4 Rg3 b5 Rxg4 b6 Rg6 a4 Rxb6+ Ka2 f5 Ka3 f4 a5 Rf6 Ka4 f3 Rf1 g5 Kb5 g4 a6 g3 a7 Rf8',
                fen: '5r2/P6k/7p/1K6/8/3P1pp1/8/5R2 w - - 1 50',
                theme: 'promotion',
                initialPly: 97,
                isWhiteToMove: true,
                solutionMovesUCI: ['f1f3', 'f8f3', 'a7a8q'],
                solutionMovesSAN: ['Rxf3', 'Rxf3', 'a8=Q'],
                attempts: 0,
                rating: 1500
            } as Puzzle;

            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzleData });
        } catch (error) {
            console.error('Failed to load specific puzzle:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
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
                    {isSessionActive && state.currentPuzzle && puzzleSetupState === 'SETUP_COMPLETE' && (
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
                        <TouchableOpacity
                            style={[styles.welcomeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onLongPress={() => setShowDebugPanel(!showDebugPanel)}
                            delayLongPress={1000}
                        >
                            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                                Welcome to Chess Woodpecker
                            </Text>
                            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
                                Start a new session to begin your training.
                                Each session will present you with a series of chess puzzles to solve.
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {showDebugPanel && (
                        <View style={[styles.debugPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.debugTitle, { color: theme.text }]}>Debug Panel</Text>
                            
                            {/* Session Debug Info */}
                            <View style={styles.debugSection}>
                                <Text style={[styles.debugText, { color: theme.text }]}>
                                    Stored Session: {hasStoredSession ? 'Yes' : 'No'}
                                </Text>
                                <TouchableOpacity 
                                    style={[styles.debugButton, { backgroundColor: theme.error }]}
                                    onPress={handleClearSession}
                                >
                                    <Text style={styles.debugButtonText}>Clear Session</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Load Specific Puzzle Section */}
                            <View style={styles.debugSection}>
                                <Text style={[styles.debugText, { color: theme.text }]}>Load Specific Puzzle:</Text>
                                <TextInput
                                    style={[styles.debugInput, { 
                                        borderColor: theme.border,
                                        color: theme.text,
                                        backgroundColor: theme.background
                                    }]}
                                    value={debugPuzzleId}
                                    onChangeText={setDebugPuzzleId}
                                    placeholder="Enter puzzle ID"
                                    placeholderTextColor={theme.textSecondary}
                                />
                                <TouchableOpacity 
                                    style={[styles.debugButton, { backgroundColor: theme.primary }]}
                                    onPress={loadSpecificPuzzle}
                                >
                                    <Text style={styles.debugButtonText}>Load Puzzle</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    
                    <View style={styles.buttonContainer}>
                        {!isSessionActive && (
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
                                
                                {hasStoredSession && (
                                    <TouchableOpacity 
                                        style={[styles.button, { backgroundColor: theme.secondary, marginTop: 12 }]} 
                                        onPress={handleResumeSession}
                                    >
                                        <Text style={styles.buttonText}>Resume Session</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
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
    debugButton: {
        alignItems: 'center',
        borderRadius: 4,
        marginLeft: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    debugButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    debugInput: {
        borderRadius: 4,
        borderWidth: 1,
        flex: 1,
        padding: 8,
    },
    debugInputContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    debugPanel: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    debugTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    debugSection: {
        marginBottom: 16,
    },
    debugText: {
        fontSize: 14,
        marginBottom: 8,
    },
});
