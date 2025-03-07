import React, { createContext, useContext, useReducer } from 'react';
import { Puzzle } from '../models/PuzzleModel';

interface AppState {
    currentPuzzle: Puzzle | null;
    isLoading: boolean;
    isSessionActive: boolean;
    theme: 'light' | 'dark';
}

// Define action types
type AppAction = 
    | { type: 'START_SESSION' }
    | { type: 'END_SESSION' }
    | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RECORD_PUZZLE_ATTEMPT'; payload: { puzzle: Puzzle; success: boolean } }
    | { type: 'TOGGLE_THEME' };

// Create context
const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Initial state
const initialState: AppState = {
    currentPuzzle: null,
    isLoading: false,
    isSessionActive: false,
    theme: 'light'
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_SESSION':
            return {
                ...state,
                isSessionActive: true,
                currentPuzzle: null,
                isLoading: false
            };

        case 'END_SESSION':
            return {
                ...state,
                isSessionActive: false,
                currentPuzzle: null,
                isLoading: false
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

        case 'RECORD_PUZZLE_ATTEMPT':
            return {
                ...state,
                currentPuzzle: action.payload.puzzle,
                isLoading: false
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