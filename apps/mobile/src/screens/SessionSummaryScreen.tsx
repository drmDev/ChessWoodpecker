import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const SessionSummaryScreen: React.FC = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.placeholderContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.placeholderText, { color: theme.text }]}>
                    TODO: Implement Session Statistics
                </Text>
                <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                    This screen will show statistics about your puzzle solving sessions in a future update.
                </Text>
            </View>
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
    }
});