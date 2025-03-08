// SessionSummaryScreen.tsx
import React from 'react';
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
                    {/* Session Statistics - renamed to Summary */}
                    <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                            Summary
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
                            <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                                Categories
                            </Text>
                            {getSortedCategories().map(item => (
                                <View key={item.category} style={styles.categoryRow}>
                                    <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                                        {formatCategoryName(item.category)}
                                    </Text>
                                    <View style={styles.categoryStats}>
                                        <Text style={[styles.categoryTotal, { color: theme.textSecondary }]}>
                                            {item.total}
                                        </Text>
                                        <Text style={[styles.categoryStatLabel, { color: theme.textSecondary }]}>
                                            total
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
                            <Text style={[styles.sectionTitle, { color: theme.accent }]}>
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
                                    <Text style={[styles.puzzleTheme, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
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
    categoryContainer: {
        borderRadius: 8,
        margin: 16,
        padding: 16,
    },
    categoryFailed: {
        fontSize: 12,
        fontWeight: '500',
    },
    categoryName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    categoryRow: {
        alignItems: 'center',
        borderBottomColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    categoryStatLabel: {
        fontSize: 12,
        marginRight: 12,
    },
    categoryStats: {
        alignItems: 'center',
        flexDirection: 'row',
        flexShrink: 0,
    },
    categorySuccess: {
        fontSize: 12,
        fontWeight: '500',
        marginRight: 12,
    },
    categoryTotal: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 4,
    },
    container: {
        flex: 1,
    },
    descriptionText: {
        fontSize: 14,
        textAlign: 'center',
    },
    failedPuzzlesContainer: {
        borderRadius: 8,
        margin: 16,
        padding: 16,
    },
    hintText: {
        fontSize: 12,
        marginBottom: 16,
    },
    placeholderContainer: {
        alignItems: 'center',
        borderRadius: 8,
        justifyContent: 'center',
        margin: 16,
        padding: 24,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    puzzleId: {
        flexShrink: 0,
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 16,
    },
    puzzleRow: {
        alignItems: 'center',
        borderBottomColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: 1,
        flexDirection: 'row',
        paddingVertical: 8,
    },
    puzzleTheme: {
        flex: 1,
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsContainer: {
        borderRadius: 8,
        margin: 16,
        padding: 16,
    },
});