import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PuzzleCacheService } from '../../services/PuzzleCacheService';

export const PuzzleCacheDebug: React.FC = () => {
    const { theme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const handleInspectCache = async () => {
        await PuzzleCacheService.debugInspectCache();
    };

    const handleClearCache = async () => {
        await PuzzleCacheService.clearCache();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity 
                style={styles.header}
                onPress={() => setIsCollapsed(!isCollapsed)}
            >
                <View style={styles.headerContent}>
                    <Ionicons name="bug" size={20} color={theme.error} />
                    <Text style={[styles.headerText, { color: theme.text }]}>Debug Panel</Text>
                </View>
                <Ionicons 
                    name={isCollapsed ? "chevron-down" : "chevron-up"} 
                    size={20} 
                    color={theme.textSecondary} 
                />
            </TouchableOpacity>

            {!isCollapsed && (
                <View style={styles.content}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={handleInspectCache}
                    >
                        <Text style={styles.buttonText}>Inspect Cache</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.error }]}
                        onPress={handleClearCache}
                    >
                        <Text style={styles.buttonText}>Clear Cache</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        borderRadius: 8,
        padding: 12,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    container: {
        borderRadius: 12,
        borderWidth: 1,
        margin: 16,
        overflow: 'hidden',
    },
    content: {
        gap: 8,
        padding: 16,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerContent: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
    },
}); 