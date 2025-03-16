import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { TurnIndicator } from '../components/chess/mobile/TurnIndicator';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { SessionStatusBar } from '../components/session/SessionStatusBar';
import { puzzleService } from '../services/PuzzleService';
import { playSound, SoundTypes } from '../utils/sounds';

export const MainScreen: React.FC = () => {
    const { theme } = useTheme();
    const { state, dispatch } = useAppState();
    const isSessionActive = state.session.isActive;

    // Simplified puzzle game hook usage
    const { 
        currentPosition, 
        handleMove,
        isOpponentMoving,
        isAutoSolving
    } = usePuzzleGame(() => handleFetchNewPuzzle());

    const handleFetchNewPuzzle = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            // Get the next puzzle from the session
            const puzzle = await puzzleService.getNextSessionPuzzle();
            
            if (!puzzle) {
                // If no more puzzles in the session, end the session
                dispatch({ type: 'END_SESSION' });
                return;
            }
            
            dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
        } catch (error) {
            console.error('Failed to fetch new puzzle:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleStartSession = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            await playSound(SoundTypes.START_SESSION);
            dispatch({ type: 'START_SESSION' });
            
            // Initialize the session with shuffled puzzles
            puzzleService.initializeSession();
            
            // Get the first puzzle from the session
            const puzzle = await puzzleService.getNextSessionPuzzle();
            if (puzzle) {
                dispatch({ type: 'SET_CURRENT_PUZZLE', payload: puzzle });
            }
        } catch (error) {
            console.error('Failed to start session:', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            {isSessionActive && <SessionStatusBar />}
            
            <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                {isSessionActive && state.currentPuzzle ? (
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <TurnIndicator isWhiteToMove={state.currentPuzzle.isWhiteToMove} />
                        <OrientableChessBoard
                            initialFen={currentPosition || state.currentPuzzle.fen}
                            orientation={state.currentPuzzle.isWhiteToMove ? 'white' : 'black'}
                            onMove={handleMove}
                            showCoordinates={true}
                        />
                    </View>
                ) : (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: theme.text, fontSize: 24, marginBottom: 20 }}>
                            Welcome to Chess Woodpecker
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: theme.primary,
                                padding: 15,
                                borderRadius: 8
                            }}
                            onPress={handleStartSession}
                        >
                            <Text style={{ color: '#fff', fontSize: 18 }}>Start Session</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};
