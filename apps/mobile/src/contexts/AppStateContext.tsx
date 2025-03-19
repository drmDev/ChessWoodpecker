// AppStateContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import { Puzzle } from '../models/PuzzleModel';

// Minimal state types
export type PuzzleTransitionState = 'STABLE' | 'TRANSITIONING' | 'LOADING' | 'RESETTING' | 'AUTO_SOLVING';
export type PuzzleSetupState = 'PRE_SETUP' | 'SETUP_IN_PROGRESS' | 'SETUP_COMPLETE';

// Ultra-simplified state
interface ChessAppState {
    currentPuzzle: Puzzle | null;
    isLoading: boolean;
    theme: 'light' | 'dark';
    puzzleTransitionState: PuzzleTransitionState;
    puzzleSetupState: PuzzleSetupState;
    elapsedTime: number;
}

// Minimal actions
type Action =
    | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'TOGGLE_THEME' }
    | { type: 'SET_PUZZLE_TRANSITION_STATE'; payload: PuzzleTransitionState }
    | { type: 'SET_PUZZLE_SETUP_STATE'; payload: PuzzleSetupState }
    | { type: 'SET_ELAPSED_TIME'; payload: number }
    | { type: 'UPDATE_TIME_DELTA'; payload: number };

const AppStateContext = createContext<{
    state: ChessAppState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Minimal initial state
const initialState: ChessAppState = {
    currentPuzzle: null,
    isLoading: false,
    theme: 'light',
    puzzleTransitionState: 'STABLE',
    puzzleSetupState: 'PRE_SETUP',
    elapsedTime: 0
};

// Minimal reducer
function appReducer(state: ChessAppState, action: Action): ChessAppState {
    switch (action.type) {
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
            
        case 'TOGGLE_THEME':
            return {
                ...state,
                theme: state.theme === 'light' ? 'dark' : 'light'
            };
            
        case 'SET_PUZZLE_TRANSITION_STATE':
            return {
                ...state,
                puzzleTransitionState: action.payload
            };

        case 'SET_PUZZLE_SETUP_STATE':
            return {
                ...state,
                puzzleSetupState: action.payload
            };

        case 'SET_ELAPSED_TIME':
            return {
                ...state,
                elapsedTime: action.payload
            };

        case 'UPDATE_TIME_DELTA':
            return {
                ...state,
                elapsedTime: state.elapsedTime + action.payload
            };

        default:
            return state;
    }
}

// Minimal provider
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    
    return (
        <AppStateContext.Provider value={{ state, dispatch }}>
            {children}
        </AppStateContext.Provider>
    );
};

// Hook
export function useAppState() {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}