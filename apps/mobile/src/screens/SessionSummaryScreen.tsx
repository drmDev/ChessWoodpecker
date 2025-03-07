import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSessionStats } from '../hooks/useSessionStats';
import { formatTimeHuman } from '../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';

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
    const {
        sessionData,
        getSuccessRate,
        getCategoryStats,
        getSessionDuration,
        resetSession
    } = useSessionStats();

    // State to keep track of the current session duration
    const [elapsedTime, setElapsedTime] = useState(getSessionDuration());

    // Update the elapsed time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(getSessionDuration());
        }, 1000);

        return () => clearInterval(interval);
    }, [getSessionDuration]);

    const handleReset = async () => {
        await resetSession();
    };

    const openPuzzleLink = (puzzleId: string) => {
        const url = `https://lichess.org/training/${puzzleId}`;
        Linking.openURL(url);
    };

    const renderCategoryStats = () => {
        const categoryStats = getCategoryStats();
        if (Object.keys(categoryStats).length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No categories yet
                    </Text>
                </View>
            );
        }
        return Object.entries(categoryStats).map(([category, stats]) => (
            <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryNameContainer}>
                    <Text style={[styles.categoryName, { color: theme.text }]}>
                        {formatCategoryName(category)}
                    </Text>
                </View>
                <View style={styles.categoryStats}>
                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                        Success: {((stats.successful / stats.total) * 100).toFixed(1)}%
                    </Text>
                    <Text style={[styles.statText, { color: theme.textSecondary }]}>
                        ({stats.successful}/{stats.total})
                    </Text>
                </View>
            </View>
        ));
    };

    const renderFailedPuzzles = () => {
        if (sessionData.failedPuzzles.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No failed puzzles yet
                    </Text>
                </View>
            );
        }
        return sessionData.failedPuzzles.map((puzzle) => (
            <TouchableOpacity
                key={puzzle.id}
                style={styles.puzzleRow}
                onPress={() => openPuzzleLink(puzzle.id)}
            >
                <Text style={[styles.puzzleId, { color: theme.primary }]}>
                    #{puzzle.id}
                </Text>
                <Text style={[styles.puzzleCategory, { color: theme.text }]}>
                    {formatCategoryName(puzzle.category)}
                </Text>
            </TouchableOpacity>
        ));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.content}>
                <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
                    <View style={styles.statRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Total Time:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {formatTimeHuman(elapsedTime)}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Puzzles Attempted:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{sessionData.totalPuzzles}</Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Success Rate:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {getSuccessRate().toFixed(1)}%
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Successful/Failed:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {sessionData.totalSuccessful}/{sessionData.totalFailed}
                        </Text>
                    </View>

                    {/* Moved Reset Session button to bottom of stats section */}
                    <View style={styles.resetContainer}>
                        <TouchableOpacity
                            style={[styles.resetButton, { backgroundColor: theme.error }]}
                            onPress={handleReset}
                        >
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text style={styles.buttonText}>Reset Session</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.categoriesContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance by Category</Text>
                    {renderCategoryStats()}
                </View>

                {sessionData.failedPuzzles.length > 0 && (
                    <View style={[styles.failedPuzzlesContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Failed Puzzles</Text>
                        <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                            Tap on a puzzle to open it in Lichess
                        </Text>
                        {renderFailedPuzzles()}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    label: {
        fontSize: 16,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    resetContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    categoriesContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    hintText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    categoryRow: {
        flexDirection: 'column',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    categoryNameContainer: {
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
    },
    categoryStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statText: {
        fontSize: 14,
    },
    failedPuzzlesContainer: {
        padding: 16,
        borderRadius: 12,
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
        flex: 1,
        textDecorationLine: 'underline',
    },
    puzzleCategory: {
        fontSize: 14,
        flex: 2,
        textAlign: 'right',
    },
    emptyState: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
});