// AppStateContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Puzzle } from '../models/PuzzleModel';
import { STORAGE_KEYS } from '../constants/storage';
import { puzzleService } from '../services/PuzzleService';
import { AppState, AppStateStatus } from 'react-native';

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
    startTime: number;
    elapsedTimeMs: number;
    pausedAt: number | null; // Keep this for internal timer calculations
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

// Add new type definition
export type PuzzleTransitionState = 
    | 'STABLE' 
    | 'TRANSITIONING' 
    | 'LOADING' 
    | 'RESETTING'
    | 'AUTO_SOLVING';
export type PuzzleSetupState = 'PRE_SETUP' | 'SETUP_IN_PROGRESS' | 'SETUP_COMPLETE';

// Renamed from AppState to ChessAppState and simplified
interface ChessAppState {
    currentPuzzle: Puzzle | null;
    isLoading: boolean;
    theme: 'light' | 'dark';
    session: SessionState;
    totalPuzzlesInSession: number;
    puzzleTransitionState: PuzzleTransitionState;
    puzzleSetupState: PuzzleSetupState;
    isAppInBackground: boolean;
}

// Define action types - updated to remove redundant actions
type Action =
    | { type: 'START_SESSION' }
    | { type: 'END_SESSION' }
    | { type: 'SET_APP_BACKGROUND'; payload: boolean }
    | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RECORD_SUCCESSFUL_PUZZLE'; payload: { id: string; theme: string; rating?: number } }
    | { type: 'RECORD_FAILED_PUZZLE'; payload: { id: string; theme: string; rating?: number } }
    | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
    | { type: 'TOGGLE_THEME' }
    | { type: 'LOAD_STORED_SESSION'; payload: Partial<ChessAppState> }
    | { type: 'SET_TOTAL_PUZZLES'; payload: number }
    | { type: 'SET_PUZZLE_TRANSITION_STATE'; payload: PuzzleTransitionState }
    | { type: 'SET_PUZZLE_SETUP_STATE'; payload: PuzzleSetupState }
    | { type: 'UPDATE_SESSION_ACTIVE'; payload: boolean };

// Create context with renamed type
const AppStateContext = createContext<{
    state: ChessAppState;
    dispatch: React.Dispatch<Action>;
    loadStoredSession: () => Promise<boolean>;
    clearStoredSession: () => Promise<boolean>;
} | undefined>(undefined);

// Initial state with simplified session
const initialState: ChessAppState = {
    currentPuzzle: null,
    isLoading: false,
    theme: 'light',
    session: {
        isActive: false,
        startTime: 0,
        elapsedTimeMs: 0,
        pausedAt: null,
        totalPuzzles: 0,
        successfulPuzzles: [],
        failedPuzzles: [],
        categoryCounts: {}
    },
    totalPuzzlesInSession: 200, // Default value, will be updated when session is initialized
    puzzleTransitionState: 'STABLE',
    puzzleSetupState: 'PRE_SETUP',
    isAppInBackground: false,
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

// Reducer function updated with simplified state
function appReducer(state: ChessAppState, action: Action): ChessAppState {
    switch (action.type) {
        case 'START_SESSION':
            return {
                ...state,
                currentPuzzle: null,
                isLoading: false,
                session: {
                    isActive: true,
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
                currentPuzzle: null,
                session: {
                    ...state.session,
                    isActive: false
                }
            };
            
        case 'SET_APP_BACKGROUND':
            return {
                ...state,
                isAppInBackground: action.payload,
                session: {
                    ...state.session,
                    // When going to background, store the current time
                    pausedAt: action.payload ? Date.now() : null
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
            return {
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
        }
            
        case 'RECORD_FAILED_PUZZLE': {
            if (!state.session.isActive) return state;
            
            const failedCategory = action.payload.theme || 'Uncategorized';
            return {
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
                // Ensure we don't overwrite these properties if they're not in the payload
                theme: action.payload.theme || state.theme,
                isLoading: false,
                puzzleTransitionState: action.payload.puzzleTransitionState || 'STABLE',
                puzzleSetupState: action.payload.puzzleSetupState || 'PRE_SETUP',
                isAppInBackground: false // Always reset this when loading a session
            };
            
        case 'SET_TOTAL_PUZZLES':
            return {
                ...state,
                totalPuzzlesInSession: action.payload,
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

        case 'UPDATE_SESSION_ACTIVE':
            return {
                ...state,
                session: {
                    ...state.session,
                    isActive: action.payload
                }
            };

        default:
            return state;
    }
}

// Provider component updated with simplified state
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
        
        // Only run timer if session is active and app is not in background
        if (state.session.isActive && !state.isAppInBackground) {
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
    }, [state.session.isActive, state.isAppInBackground, state.session.elapsedTimeMs]);
    
    // Handle app state changes to auto-pause session
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                dispatch({ type: 'SET_APP_BACKGROUND', payload: true });
            } else if (nextAppState === 'active') {
                dispatch({ type: 'SET_APP_BACKGROUND', payload: false });
            }
        };
        
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
            subscription.remove();
        };
    }, [dispatch]);

    // Save session state to AsyncStorage whenever it changes - enhanced
    useEffect(() => {
        // Only save session if it's active
        if (state.session.isActive) {
            // Create a complete version of the state to store
            const stateToStore = {
                session: state.session,
                currentPuzzle: state.currentPuzzle,
                totalPuzzlesInSession: state.totalPuzzlesInSession,
                theme: state.theme,
                puzzleTransitionState: state.puzzleTransitionState,
                puzzleSetupState: state.puzzleSetupState,
                isAppInBackground: state.isAppInBackground
            };
            
            AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(stateToStore))
                .catch(error => console.error('Failed to save session state:', error));
        }
    }, [
        state.session, 
        state.currentPuzzle, 
        state.totalPuzzlesInSession,
        state.puzzleTransitionState,
        state.puzzleSetupState,
        state.isAppInBackground
    ]);

    // Update total puzzles when session starts
    useEffect(() => {
        if (state.session.isActive && state.session.startTime) {
            // Get the actual number of puzzles in the session
            const totalPuzzles = puzzleService.getRemainingPuzzleCount();
            if (totalPuzzles > 0) {
                dispatch({ type: 'SET_TOTAL_PUZZLES', payload: totalPuzzles });
            }
        }
    }, [state.session.isActive, state.session.startTime]);

    // Add a more robust function to load stored session
    const loadStoredSession = useCallback(async () => {
        try {
            const savedSessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
            if (savedSessionData) {
                const storedState = JSON.parse(savedSessionData);
                
                // Validate the stored state has required properties
                if (!storedState.session || !storedState.session.isActive) {
                    console.warn('Stored session is invalid or inactive');
                    return false;
                }
                
                // Calculate elapsed time adjustment if app was in background
                let adjustedState = { ...storedState };
                if (storedState.session.pausedAt) {
                    const now = Date.now();
                    const pausedAt = storedState.session.pausedAt;
                    
                    // Don't count time while app was in background
                    adjustedState = {
                        ...adjustedState,
                        session: {
                            ...adjustedState.session,
                            pausedAt: null
                        },
                        isAppInBackground: false
                    };
                }
                
                // Dispatch the adjusted state
                dispatch({ type: 'LOAD_STORED_SESSION', payload: adjustedState });
                
                // Initialize puzzle service if needed
                if (puzzleService.getRemainingPuzzleCount() === 0) {
                    puzzleService.initializeSession();
                }
                
                return true;
            }
        } catch (error) {
            console.error('Failed to load stored session:', error);
        }
        return false;
    }, [dispatch]);

    // Add a function to clear stored session
    const clearStoredSession = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
            return true;
        } catch (error) {
            console.error('Failed to clear stored session:', error);
            return false;
        }
    }, []);

    // Update the context value to include these functions
    const contextValue = {
        state,
        dispatch,
        loadStoredSession,
        clearStoredSession
    };

    return (
        <AppStateContext.Provider value={contextValue}>
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