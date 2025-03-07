import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSessionStats } from '../hooks/useSessionStats';
import { formatTimeHuman } from '../utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const SessionSummaryScreen: React.FC = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const {
        sessionData,
        getSuccessRate,
        getCategoryStats,
        getSessionDuration,
        resetSession
    } = useSessionStats();

    const handleReset = async () => {
        await resetSession();
        navigation.goBack();
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
                <Text style={[styles.categoryName, { color: theme.text }]}>{category}</Text>
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
            <View key={puzzle.id} style={styles.puzzleRow}>
                <Text style={[styles.puzzleId, { color: theme.textSecondary }]}>
                    #{puzzle.id}
                </Text>
                <Text style={[styles.puzzleCategory, { color: theme.text }]}>
                    {puzzle.category}
                </Text>
            </View>
        ));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: theme.text }]}>Session Summary</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={[styles.closeButton, { backgroundColor: theme.primary }]}
                        onPress={navigation.goBack}
                    >
                        <Ionicons name="close" size={20} color="white" />
                        <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
                    <View style={styles.resetContainer}>
                        <TouchableOpacity 
                            style={[styles.resetButton, { backgroundColor: theme.error }]}
                            onPress={handleReset}
                        >
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text style={styles.buttonText}>Reset Session</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Total Time:</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {formatTimeHuman(getSessionDuration())}
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
                </View>

                <View style={[styles.categoriesContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance by Category</Text>
                    {renderCategoryStats()}
                </View>

                {sessionData.failedPuzzles.length > 0 && (
                    <View style={[styles.failedPuzzlesContainer, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Failed Puzzles</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flex: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    resetContainer: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 4,
    },
    closeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
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
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    categoryName: {
        fontSize: 16,
    },
    categoryStats: {
        flexDirection: 'row',
        gap: 8,
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
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    puzzleId: {
        fontSize: 14,
        flex: 1,
    },
    puzzleCategory: {
        fontSize: 14,
        flex: 2,
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