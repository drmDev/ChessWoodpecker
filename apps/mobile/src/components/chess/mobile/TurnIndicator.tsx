import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface TurnIndicatorProps {
    isWhiteToMove: boolean;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ isWhiteToMove }) => {
    const { theme } = useTheme();
    
    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.text, { color: theme.text }]}>
                {isWhiteToMove ? "White" : "Black"} to move
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
}); 