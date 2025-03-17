import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { puzzleService } from "../../services/PuzzleService";

interface SessionStatusBarProps {
    onEndSession: () => void;
}

export const SessionStatusBar: React.FC<SessionStatusBarProps> = ({ onEndSession }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border}]}>
            <Text style={[styles.headerText, { color: theme.text}]}>
                Puzzle {puzzleService.getCurrentPuzzleIndex()}/200
            </Text>
            <TouchableOpacity
                style={[styles.endSessionButton, { backgroundColor: theme.error }]}
                onPress={onEndSession}
            >
                <Text style={styles.endSessionButtonText}>End Session</Text>
            </TouchableOpacity>
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
    headerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    endSessionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    endSessionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});