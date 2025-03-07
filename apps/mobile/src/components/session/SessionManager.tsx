import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppState } from '../../contexts/AppStateContext';
import { puzzleService } from '../../services/PuzzleService';
import { Ionicons } from '@expo/vector-icons';
import { playSound, SoundTypes } from '../../utils/sounds';

export const SessionManager: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { theme } = useTheme();
    
    const isActive = !state.sessionStats.isCurrentSessionPaused() && state.currentPuzzle !== null;
    const isPaused = state.sessionStats.isCurrentSessionPaused();
    
    const handleStartSession = async () => {
        try {
            dispatch({ type: 'START_SESSION' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const puzzle = await puzzleService.fetchRandomPuzzle();
            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
            await playSound(SoundTypes.START_SESSION);
        } catch (error) {
            console.error('Failed to start session:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    
    const handleEndSession = async () => {
        await playSound(SoundTypes.END_SESSION);
        dispatch({ type: 'END_SESSION' });
    };

    const handlePauseSession = async () => {
        if (state.currentPuzzle) {
            dispatch({ type: 'PAUSE_SESSION', payload: state.currentPuzzle.id });
        }
    };

    const handleResumeSession = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const currentPuzzleId = state.sessionStats.getCurrentPuzzleId();
            if (currentPuzzleId) {
                const puzzle = await puzzleService.fetchPuzzleById(currentPuzzleId);
                if (puzzle) {
                    dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
                    dispatch({ type: 'RESUME_SESSION' });
                }
            }
        } catch (error) {
            console.error('Failed to resume session:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    
    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {!isActive && !isPaused ? (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleStartSession}
                >
                    <Ionicons name="play" size={20} color="white" />
                    <Text style={styles.buttonText}>Start Session</Text>
                </TouchableOpacity>
            ) : (
                <View>
                    {state.isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.loadingText, { color: theme.text }]}>Loading puzzle...</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonRow}>
                            {isPaused ? (
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.primary }]}
                                    onPress={handleResumeSession}
                                >
                                    <Ionicons name="play" size={20} color="white" />
                                    <Text style={styles.buttonText}>Resume Session</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: theme.warning }]}
                                        onPress={handlePauseSession}
                                    >
                                        <Ionicons name="pause" size={20} color="white" />
                                        <Text style={styles.buttonText}>Pause Session</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: theme.error }]}
                                        onPress={handleEndSession}
                                    >
                                        <Ionicons name="stop" size={20} color="white" />
                                        <Text style={styles.buttonText}>End Session</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'nowrap', // Prevent wrapping
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        minWidth: 100, // Ensure minimum width
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
        textAlign: 'center',
        flexShrink: 1, // Allow text to shrink if needed
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    loadingText: {
        marginLeft: 8,
        fontWeight: '500',
    },
}); 