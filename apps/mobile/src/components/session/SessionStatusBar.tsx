import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { puzzleService } from '../../services/PuzzleService';
import { formatTimeHHMMSS } from '@utils/timeUtils';
import { useAppState } from '../../contexts/AppStateContext';
import { timerService } from '../../services/TimerService';
import { SEMANTIC_COLORS } from '../../constants/colors';

interface SessionStatusBarProps {
    onEndSession: () => void;
}

export const SessionStatusBar: React.FC<SessionStatusBarProps> = ({ onEndSession }) => {
    const { state, dispatch } = useAppState();
    const { theme } = useTheme();

    // Initialize timer when component mounts
    useEffect(() => {
        // Set up the dispatch function in the timer service
        timerService.setDispatch(dispatch);

        // Start the timer if it's not already running
        if (!timerService.isRunning()) {
            timerService.start();
        }

        // Clean up when the component unmounts
        return () => {
            timerService.cleanup();
        };
    }, [dispatch]);

    return (
        <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={styles.leftSection}>
                <Text style={[styles.headerText, { color: theme.text }]}>
                    Puzzle {puzzleService.getCurrentPuzzleIndex()}/200
                </Text>
            </View>
            <View style={styles.centerSection}>
                <Text style={[styles.timerText, { color: SEMANTIC_COLORS.TIMER }]}>
                    {formatTimeHHMMSS(state.elapsedTime)}
                </Text>
            </View>
            <View style={styles.rightSection}>
                <TouchableOpacity
                    style={[styles.endSessionButton, { backgroundColor: theme.error }]}
                    onPress={() => {
                        // Pause the timer when ending session
                        timerService.pause();
                        onEndSession();
                    }}
                >
                    <Text style={styles.endSessionButtonText}>End Session</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    leftSection: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerSection: {
        flex: 1,
        alignItems: 'flex-start',
    },
    rightSection: {
        flex: 1,
        alignItems: 'flex-end',
    },
    headerText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    endSessionButton: {
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    endSessionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});