// AppStateContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { Puzzle } from '../models/PuzzleModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface AppState {
    currentPuzzle: Puzzle | null;
    isLoading: boolean;
    theme: 'light' | 'dark';
    isSessionActive: boolean;
    session: SessionState;
}

// Define action types
type AppAction =
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
    | { type: 'LOAD_STORED_SESSION'; payload: SessionState };

// Create context
const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Add storage key constant at the top
const SESSION_STORAGE_KEY = '@chess_woodpecker/session';

// Initial state with simplified session
const initialState: AppState = {
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
    }
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

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_SESSION':
            return {
                ...state,
                isSessionActive: true,
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
                isLoading: false,
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
                isSessionActive: true,
                session: action.payload
            };
            
        default:
            return state;
    }
}

// Provider component
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