// SessionSummaryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import { formatTimeHHMMSS } from '../utils/timeUtils'; // Assuming you have this utility

// Helper function to format category names from SNAKE_CASE to "Pascal Case"
const formatCategoryName = (category: string): string => {
    if (!category || category === 'Uncategorized') return 'Uncategorized';

    return category
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const SessionSummaryScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state } = useAppState();
    const { session } = state;

    // State to force re-render every second to update time display
    const [, setTick] = useState(0);

    // Update the timer display every second
    useEffect(() => {
        if (!session.isActive) return;

        const interval = setInterval(() => {
            setTick(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [session.isActive]);

    const openPuzzleLink = (puzzleId: string) => {
        const url = `https://lichess.org/training/${puzzleId}`;
        Linking.openURL(url);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {!session.isActive ? (
                <View style={[styles.placeholderContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.placeholderText, { color: theme.text }]}>
                        No Active Session
                    </Text>
                    <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                        Start a session on the home screen to see statistics here.
                    </Text>
                </View>
            ) : (
                <ScrollView>
                    <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Session Statistics
                        </Text>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Total Time:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {formatTimeHHMMSS(session.totalTimeMs)}
                            </Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Failed Puzzles:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {session.failedPuzzles.length}
                            </Text>
                        </View>
                    </View>

                    {session.failedPuzzles.length > 0 && (
                        <View style={[styles.failedPuzzlesContainer, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Failed Puzzles
                            </Text>
                            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                                Tap on a puzzle to open it in Lichess
                            </Text>

                            {session.failedPuzzles.map((puzzle, index) => (
                                <TouchableOpacity
                                    key={`${puzzle.id}-${index}`}
                                    style={styles.puzzleRow}
                                    onPress={() => openPuzzleLink(puzzle.id)}
                                >
                                    <Text style={[styles.puzzleId, { color: theme.primary }]}>
                                        #{puzzle.id}
                                    </Text>
                                    <Text style={[styles.puzzleTheme, { color: theme.text }]}>
                                        {formatCategoryName(puzzle.theme)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    placeholderContainer: {
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    statsContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    statLabel: {
        fontSize: 16,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    failedPuzzlesContainer: {
        padding: 16,
        borderRadius: 12,
    },
    hintText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    puzzleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    puzzleId: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    puzzleTheme: {
        fontSize: 14,
        textAlign: 'right',
    },
});