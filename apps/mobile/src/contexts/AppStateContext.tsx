// AppStateContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Puzzle } from '../models/PuzzleModel';
import { timerService } from '../services/TimerService';

// Define the session state structure
interface SessionState {
    isActive: boolean;
    totalTimeMs: number;
    failedPuzzles: {
        id: string;
        theme: string;
        timestamp: number;
    }[];
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
    | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RECORD_FAILED_PUZZLE'; payload: { id: string; theme: string } }
    | { type: 'UPDATE_TIME_DELTA'; payload: number }
    | { type: 'TOGGLE_THEME' };

// Create context
const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Initial state with simplified session
const initialState: AppState = {
    currentPuzzle: null,
    isLoading: false,
    theme: 'light',
    isSessionActive: false,
    session: {
        isActive: false,
        totalTimeMs: 0,
        failedPuzzles: []
    }
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_SESSION':
            console.log('[AppStateContext] Starting new session');
            // Start the timer service when session starts
            timerService.start();
            return {
                ...state,
                isSessionActive: true,
                currentPuzzle: null,
                isLoading: false,
                session: {
                    isActive: true,
                    totalTimeMs: 0,
                    failedPuzzles: []
                }
            };

        case 'END_SESSION':
            console.log('[AppStateContext] Ending session');
            // Stop the timer service when session ends
            timerService.stop();
            return {
                ...state,
                isSessionActive: false,
                currentPuzzle: null,
                isLoading: false,
                session: {
                    ...state.session,
                    isActive: false
                }
            };

        case 'SET_CURRENT_PUZZLE':
            console.log('[AppStateContext] Setting current puzzle:', {
                id: action.payload.id,
                fen: action.payload.fen
            });
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

        case 'RECORD_FAILED_PUZZLE':
            console.log('[AppStateContext] Recording failed puzzle:', action.payload.id);
            // Only record if session is active
            if (!state.session.isActive) return state;

            return {
                ...state,
                session: {
                    ...state.session,
                    failedPuzzles: [
                        ...state.session.failedPuzzles,
                        {
                            id: action.payload.id,
                            theme: action.payload.theme || 'Uncategorized',
                            timestamp: Date.now()
                        }
                    ]
                }
            };

        case 'UPDATE_TIME_DELTA':
            // Only update time if session is active
            if (!state.session.isActive) return state;

            return {
                ...state,
                session: {
                    ...state.session,
                    totalTimeMs: state.session.totalTimeMs + action.payload
                }
            };

        case 'TOGGLE_THEME':
            return {
                ...state,
                theme: state.theme === 'light' ? 'dark' : 'light'
            };

        default:
            return state;
    }
}

// Provider component
export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Set up timer service with the dispatch function
    useEffect(() => {
        timerService.setDispatch(dispatch);

        // Clean up timer service on unmount
        return () => {
            timerService.cleanup();
        };
    }, []);

    return (
        <AppStateContext.Provider value={{ state, dispatch }}>
            {children}
        </AppStateContext.Provider>
    );
}

// Hook for using the app state
export function useAppState() {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}