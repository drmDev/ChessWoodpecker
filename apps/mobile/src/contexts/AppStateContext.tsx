// AppStateContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { Puzzle } from '../models/PuzzleModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { puzzleService } from '../services/PuzzleService';

// Define puzzle attempt record structure
interface PuzzleAttempt {
    id: string;
    theme: string;
    rating?: number;
    timestamp: number;
    isSuccessful: boolean;
}

// Define the session state structure
interface SessionState {
    isActive: boolean;
    isPaused: boolean;
    startTime: number;
    elapsedTimeMs: number; // Single source of truth for elapsed time
    pausedAt: number | null;
    totalPuzzles: number;
    successfulPuzzles: PuzzleAttempt[];
    failedPuzzles: PuzzleAttempt[];
    categoryCounts: {
        [category: string]: {
            total: number;
            successful: number;
            failed: number;
        };
    };
}

// Renamed from AppState to ChessAppState
interface ChessAppState {
    currentPuzzle: Puzzle | null;
    isLoading: boolean;
    theme: 'light' | 'dark';
    isSessionActive: boolean;
    session: SessionState;
    puzzlesSolved: number;
    puzzlesAttempted: number;
    sessionStartTime: number | null;
    sessionCompletedTime: number | null;
    totalPuzzlesInSession: number;
}

// Define action types
type Action =
    | { type: 'START_SESSION' }
    | { type: 'END_SESSION' }
    | { type: 'PAUSE_SESSION' }
    | { type: 'RESUME_SESSION' }
    | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RECORD_SUCCESSFUL_PUZZLE'; payload: { id: string; theme: string; rating?: number } }
    | { type: 'RECORD_FAILED_PUZZLE'; payload: { id: string; theme: string; rating?: number } }
    | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
    | { type: 'TOGGLE_THEME' }
    | { type: 'LOAD_STORED_SESSION'; payload: Partial<ChessAppState> }
    | { type: 'SET_TOTAL_PUZZLES'; payload: number }
    | { type: 'INCREMENT_PUZZLES_SOLVED' }
    | { type: 'INCREMENT_PUZZLES_ATTEMPTED' };

// Create context with renamed type
const AppStateContext = createContext<{
    state: ChessAppState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Add storage key constant at the top
const SESSION_STORAGE_KEY = '@chess_woodpecker/session';

// Initial state with simplified session
const initialState: ChessAppState = {
    currentPuzzle: null,
    isLoading: false,
    theme: 'light',
    isSessionActive: false,
    session: {
        isActive: false,
        isPaused: false,
        startTime: 0,
        elapsedTimeMs: 0,
        pausedAt: null,
        totalPuzzles: 0,
        successfulPuzzles: [],
        failedPuzzles: [],
        categoryCounts: {}
    },
    puzzlesSolved: 0,
    puzzlesAttempted: 0,
    sessionStartTime: null,
    sessionCompletedTime: null,
    totalPuzzlesInSession: 200, // Default value, will be updated when session is initialized
};

// Helper function to update category counts
function updateCategoryCounts(
    categoryCounts: SessionState['categoryCounts'],
    category: string,
    isSuccess: boolean
): SessionState['categoryCounts'] {
    const updatedCounts = { ...categoryCounts };
    
    if (!updatedCounts[category]) {
        updatedCounts[category] = {
            total: 0,
            successful: 0,
            failed: 0
        };
    }
    
    updatedCounts[category].total += 1;
    
    if (isSuccess) {
        updatedCounts[category].successful += 1;
    } else {
        updatedCounts[category].failed += 1;
    }
    
    return updatedCounts;
}

// Reducer function updated with renamed type
function appReducer(state: ChessAppState, action: Action): ChessAppState {
    switch (action.type) {
        case 'START_SESSION':
            return {
                ...state,
                isSessionActive: true,
                puzzlesSolved: 0,
                puzzlesAttempted: 0,
                sessionStartTime: Date.now(),
                sessionCompletedTime: null,
                currentPuzzle: null,
                isLoading: false,
                session: {
                    isActive: true,
                    isPaused: false,
                    startTime: Date.now(),
                    elapsedTimeMs: 0,
                    pausedAt: null,
                    totalPuzzles: 0,
                    successfulPuzzles: [],
                    failedPuzzles: [],
                    categoryCounts: {}
                }
            };

        case 'END_SESSION':
            return {
                ...state,
                isSessionActive: false,
                currentPuzzle: null,
                sessionCompletedTime: Date.now(),
                session: {
                    ...state.session,
                    isActive: false,
                    isPaused: false
                }
            };
            
        case 'PAUSE_SESSION':
            return {
                ...state,
                session: {
                    ...state.session,
                    isPaused: true,
                    pausedAt: Date.now()
                }
            };
            
        case 'RESUME_SESSION':
            return {
                ...state,
                session: {
                    ...state.session,
                    isPaused: false,
                    pausedAt: null
                }
            };

        case 'SET_CURRENT_PUZZLE':
            return {
                ...state,
                currentPuzzle: action.payload,
                isLoading: false
            };
            
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload
            };
            
        case 'RECORD_SUCCESSFUL_PUZZLE': {
            if (!state.session.isActive) return state;
            
            const category = action.payload.theme || 'Uncategorized';
            const newState = {
                ...state,
                session: {
                    ...state.session,
                    totalPuzzles: state.session.totalPuzzles + 1,
                    successfulPuzzles: [
                        ...state.session.successfulPuzzles,
                        {
                            id: action.payload.id,
                            theme: category,
                            rating: action.payload.rating,
                            timestamp: Date.now(),
                            isSuccessful: true
                        }
                    ],
                    categoryCounts: updateCategoryCounts(
                        state.session.categoryCounts,
                        category,
                        true
                    )
                }
            };
            
            // Persist session after update
            AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState.session))
                .catch(error => console.error('Failed to save session:', error));
            
            return newState;
        }
            
        case 'RECORD_FAILED_PUZZLE': {
            if (!state.session.isActive) return state;
            
            const failedCategory = action.payload.theme || 'Uncategorized';
            const newState = {
                ...state,
                session: {
                    ...state.session,
                    totalPuzzles: state.session.totalPuzzles + 1,
                    failedPuzzles: [
                        ...state.session.failedPuzzles,
                        {
                            id: action.payload.id,
                            theme: failedCategory,
                            rating: action.payload.rating,
                            timestamp: Date.now(),
                            isSuccessful: false
                        }
                    ],
                    categoryCounts: updateCategoryCounts(
                        state.session.categoryCounts,
                        failedCategory,
                        false
                    )
                }
            };
            
            // Persist session after update
            AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState.session))
                .catch(error => console.error('Failed to save session:', error));
            
            return newState;
        }
            
        case 'UPDATE_ELAPSED_TIME':
            return {
                ...state,
                session: {
                    ...state.session,
                    elapsedTimeMs: action.payload
                }
            };
            
        case 'TOGGLE_THEME':
            return {
                ...state,
                theme: state.theme === 'light' ? 'dark' : 'light'
            };
            
        case 'LOAD_STORED_SESSION':
            return {
                ...state,
                ...action.payload,
                isSessionActive: true,
            };
            
        case 'SET_TOTAL_PUZZLES':
            return {
                ...state,
                totalPuzzlesInSession: action.payload,
            };
            
        case 'INCREMENT_PUZZLES_SOLVED':
            return {
                ...state,
                puzzlesSolved: state.puzzlesSolved + 1,
            };
            
        case 'INCREMENT_PUZZLES_ATTEMPTED':
            return {
                ...state,
                puzzlesAttempted: state.puzzlesAttempted + 1,
            };
            
        default:
            return state;
    }
}

// Provider component updated with renamed type
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Single timer to update elapsed time
    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        // Only run timer if session is active
        if (state.session.isActive && !state.session.isPaused) {
            timerRef.current = setInterval(() => {
                dispatch({ 
                    type: 'UPDATE_ELAPSED_TIME', 
                    payload: state.session.elapsedTimeMs + 1000 // Add 1 second
                });
            }, 1000);
        }
        
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [state.session.isActive, state.session.isPaused, state.session.elapsedTimeMs]);
    
    // Handle app state changes to auto-pause session
    useEffect(() => {
        const _handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'background' && state.isSessionActive && !state.session.isPaused) {
                // Auto-pause when app goes to background
                dispatch({ type: 'PAUSE_SESSION' });
            }
        };        
    }, [state.isSessionActive, state.session.isPaused]);

    // Save session state to AsyncStorage whenever it changes
    useEffect(() => {
        if (state.isSessionActive) {
            const sessionData = {
                puzzlesSolved: state.puzzlesSolved,
                puzzlesAttempted: state.puzzlesAttempted,
                sessionStartTime: state.sessionStartTime,
                totalPuzzlesInSession: state.totalPuzzlesInSession,
            };

            AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
                .catch(error => console.error('Failed to save session state:', error));
        }
    }, [state.isSessionActive, state.puzzlesSolved, state.puzzlesAttempted]);

    // Update total puzzles when session starts
    useEffect(() => {
        if (state.isSessionActive && state.sessionStartTime) {
            // Get the actual number of puzzles in the session
            const totalPuzzles = puzzleService.getRemainingPuzzleCount();
            if (totalPuzzles > 0) {
                dispatch({ type: 'SET_TOTAL_PUZZLES', payload: totalPuzzles });
            }
        }
    }, [state.isSessionActive, state.sessionStartTime]);

    return (
        <AppStateContext.Provider value={{ state, dispatch }}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hook to use the app state
export function useAppState() {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}