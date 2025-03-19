import React, { useEffect } from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { puzzleService } from "../../services/PuzzleService";
import { formatTimeHHMMSS } from "../../utils/timeUtils";
import { useAppState } from "../../contexts/AppStateContext";
import { timerService } from "../../services/TimerService";
import { SEMANTIC_COLORS } from '../../constants/colors';
import { sharedStyles } from '../../styles/shared';

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
        <View style={[sharedStyles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border}]}>
            <View style={styles.leftSection}>
                <Text style={[sharedStyles.headerText, { color: theme.text }]}>
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
                    style={[sharedStyles.actionButton, { backgroundColor: theme.error }]}
                    onPress={() => {
                        // Pause the timer when ending session
                        timerService.pause();
                        onEndSession();
                    }}
                >
                    <Text style={sharedStyles.actionButtonText}>End Session</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Use StyleSheet.create to properly type the styles
const styles = StyleSheet.create({
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
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});