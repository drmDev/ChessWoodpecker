import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SessionStats } from '../services/SessionStats';
import { Puzzle } from '../models/PuzzleModel';

interface AppState {
    sessionStats: SessionStats;
    currentPuzzle: Puzzle | null;
    isLoading: boolean;
    theme: 'light' | 'dark';
}

// Define action types
type AppAction = 
    | { type: 'START_SESSION' }
    | { type: 'END_SESSION' }
    | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RECORD_PUZZLE_ATTEMPT'; payload: { puzzle: Puzzle; success: boolean } }
    | { type: 'PAUSE_SESSION'; payload: string }
    | { type: 'RESUME_SESSION' }
    | { type: 'TOGGLE_THEME' };

// Create context
const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Initial state
const initialState: AppState = {
    sessionStats: new SessionStats(),
    currentPuzzle: null,
    isLoading: false,
    theme: 'light'
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_SESSION':
            console.log('[AppStateContext] Starting new session');
            state.sessionStats.reset();
            return {
                ...state,
                currentPuzzle: null,
                isLoading: false
            };
            
        case 'END_SESSION':
            return {
                ...state,
                currentPuzzle: null,
                isLoading: false
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
            
        case 'RECORD_PUZZLE_ATTEMPT':
            state.sessionStats.recordPuzzleAttempt(
                {
                    id: action.payload.puzzle.id,
                    category: 'Uncategorized',
                    rating: 0
                },
                action.payload.success
            );
            return {
                ...state,
                sessionStats: state.sessionStats
            };
            
        case 'PAUSE_SESSION':
            state.sessionStats.pauseSession(action.payload);
            return {
                ...state,
                currentPuzzle: null
            };
            
        case 'RESUME_SESSION':
            state.sessionStats.resumeSession();
            return state;
            
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

    // Load saved session on mount
    useEffect(() => {
        console.log('[AppStateContext] Provider mounted, loading saved session');
        const loadSession = async () => {
            const loaded = await state.sessionStats.loadSession();
            if (loaded) {
                console.log('[AppStateContext] Loaded saved session');
                // Only dispatch if we actually need to update loading state
                if (state.isLoading) {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            }
        };
        loadSession();
    }, []); // Remove state from dependencies as it's not needed for the load operation

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