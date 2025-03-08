// SessionSummaryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, FlatList } from 'react-native';
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

    const openPuzzleLink = (puzzleId: string) => {
        const url = `https://lichess.org/training/${puzzleId}`;
        Linking.openURL(url);
    };

    // Calculate success rate
    const calculateSuccessRate = () => {
        if (session.totalPuzzles === 0) return '0%';
        const rate = (session.successfulPuzzles.length / session.totalPuzzles) * 100;
        return `${rate.toFixed(1)}%`;
    };

    // Get categories sorted by total count
    const getSortedCategories = () => {
        return Object.entries(session.categoryCounts)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([category, stats]) => ({
                category,
                ...stats
            }));
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
                    {/* Session Statistics */}
                    <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Session Statistics
                        </Text>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.primary }]}>
                                Total Time:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {formatTimeHHMMSS(session.elapsedTimeMs)}
                            </Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.primary }]}>
                                Total Puzzles:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {session.totalPuzzles}
                            </Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.primary }]}>
                                Successful Puzzles:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.success }]}>
                                {session.successfulPuzzles.length}
                            </Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.primary }]}>
                                Failed Puzzles:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.error }]}>
                                {session.failedPuzzles.length}
                            </Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={[styles.statLabel, { color: theme.primary }]}>
                                Success Rate:
                            </Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {calculateSuccessRate()}
                            </Text>
                        </View>
                    </View>

                    {/* Category Statistics */}
                    {Object.keys(session.categoryCounts).length > 0 && (
                        <View style={[styles.categoryContainer, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Categories
                            </Text>
                            {getSortedCategories().map(item => (
                                <View key={item.category} style={styles.categoryRow}>
                                    <Text style={[styles.categoryName, { color: theme.text }]}>
                                        {formatCategoryName(item.category)}
                                    </Text>
                                    <View style={styles.categoryStats}>
                                        <Text style={[styles.categoryTotal, { color: theme.textSecondary }]}>
                                            {item.total} total
                                        </Text>
                                        <Text style={[styles.categorySuccess, { color: theme.success }]}>
                                            {item.successful} ✓
                                        </Text>
                                        <Text style={[styles.categoryFailed, { color: theme.error }]}>
                                            {item.failed} ✗
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Failed Puzzles List */}
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
    },
    placeholderContainer: {
        margin: 16,
        padding: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        textAlign: 'center',
    },
    statsContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoryContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryStats: {
        flexDirection: 'row',
    },
    categoryTotal: {
        fontSize: 12,
        marginRight: 8,
    },
    categorySuccess: {
        fontSize: 12,
        marginRight: 8,
    },
    categoryFailed: {
        fontSize: 12,
    },
    failedPuzzlesContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
    },
    hintText: {
        fontSize: 12,
        marginBottom: 16,
    },
    puzzleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    puzzleId: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 16,
    },
    puzzleTheme: {
        fontSize: 14,
    },
});