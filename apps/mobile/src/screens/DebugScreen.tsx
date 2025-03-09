import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_STORAGE_KEY = '@chess_woodpecker/session';

export const DebugScreen: React.FC = () => {
    const { theme } = useTheme();

    const handleLogSession = async () => {
        try {
            const sessionData = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
            console.log('Current Session Data:', sessionData ? JSON.parse(sessionData) : 'No session data');
        } catch (error) {
            console.error('Failed to log session:', error);
        }
    };

    const handleClearSession = async () => {
        try {
            await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
            console.log('Session cleared successfully');
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleLogSession}
            >
                <Text style={styles.buttonText}>Log Session</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.error }]}
                onPress={handleClearSession}
            >
                <Text style={styles.buttonText}>Clear Session</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 