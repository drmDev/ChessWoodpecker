import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface TurnIndicatorProps {
    isWhiteToMove: boolean;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ isWhiteToMove }) => {
    const { theme, themeMode } = useTheme();
    const isDark = themeMode === 'dark';
    
    // Use specific colors for white/black that work well in both themes
    const moveColor = isWhiteToMove 
        ? isDark ? '#FFFFFF' : '#FFFFFF'  // White moves: pure white in dark mode, pure white in light mode
        : isDark ? '#666666' : '#000000'; // Black moves: dark gray in dark mode, pure black in light mode
    
    const backgroundColor = isWhiteToMove
        ? isDark ? '#444444' : '#333333'  // White moves: darker background to contrast with white text
        : isDark ? '#222222' : '#E0E0E0'; // Black moves: very dark in dark mode, light gray in light mode

    return (
        <View style={[
            styles.container, 
            { 
                backgroundColor: theme.surface,
                borderColor: theme.border 
            }
        ]}>
            <View style={[
                styles.indicator,
                { backgroundColor }
            ]}>
                <Text style={[
                    styles.text,
                    { color: moveColor }
                ]}>
                    {isWhiteToMove ? "White" : "Black"} to move
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
        padding: 4,
    },
    indicator: {
        borderRadius: 6,
        padding: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
}); 