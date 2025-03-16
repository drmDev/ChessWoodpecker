// AppStateContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Puzzle } from '../models/PuzzleModel';
import { STORAGE_KEYS } from '../constants/storage';

// Result of a completed puzzle
interface PuzzleResult {
  id: string;
  theme: string;
  timeSpentMs: number;
  isSuccessful: boolean;
}

// Session state
interface SessionState {
  isActive: boolean;
  completedPuzzles: PuzzleResult[];
  sessionTimeMs: number;
}

// Minimal app state
interface ChessAppState {
  session: SessionState;
  currentPuzzle: Puzzle | null;
  isLoading: boolean;
}

// Initial state
const initialState: ChessAppState = {
  session: {
    isActive: false,
    completedPuzzles: [],
    sessionTimeMs: 0
  },
  currentPuzzle: null,
  isLoading: false
};

// Minimal actions - only what truly matters
type Action =
  | { type: 'START_SESSION' }
  | { type: 'END_SESSION' }
  | { type: 'SET_CURRENT_PUZZLE'; payload: Puzzle } // Changed from LOAD_PUZZLE to match MainScreen
  | { type: 'COMPLETE_PUZZLE'; payload: { isSuccessful: boolean; timeSpentMs: number } }
  | { type: 'SET_LOADING'; payload: boolean };

// Create context
const AppStateContext = createContext<{
  state: ChessAppState;
  dispatch: React.Dispatch<Action>;
  loadStoredSession: () => Promise<boolean>;
  clearStoredSession: () => Promise<boolean>;
} | undefined>(undefined);

// Minimal reducer
function appReducer(state: ChessAppState, action: Action): ChessAppState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: true,
          completedPuzzles: [],
          sessionTimeMs: 0
        },
        isLoading: true
      };
      
    case 'END_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: false
        },
        currentPuzzle: null,
        isLoading: false
      };
      
    case 'SET_CURRENT_PUZZLE': // Changed from LOAD_PUZZLE to match MainScreen
      return {
        ...state,
        currentPuzzle: action.payload,
        isLoading: false
      };
      
    case 'COMPLETE_PUZZLE':
      if (!state.currentPuzzle) return state;
      
      return {
        ...state,
        session: {
          ...state.session,
          completedPuzzles: [
            ...state.session.completedPuzzles,
            {
              id: state.currentPuzzle.id,
              theme: state.currentPuzzle.theme || 'unknown',
              timeSpentMs: action.payload.timeSpentMs,
              isSuccessful: action.payload.isSuccessful
            }
          ],
          sessionTimeMs: state.session.sessionTimeMs + action.payload.timeSpentMs
        },
        currentPuzzle: null,
        isLoading: true // Set loading to true as we'll need to load the next puzzle
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    default:
      return state;
  }
}

// Provider component
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Save session state to AsyncStorage whenever it changes
  useEffect(() => {
    if (state.session.isActive) {
      AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(state))
        .catch(error => console.error('Failed to save session state:', error));
    }
  }, [state]);

  // Load stored session
  const loadStoredSession = useCallback(async (): Promise<boolean> => {
    try {
      const savedSessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSessionData) {
        const storedState = JSON.parse(savedSessionData) as ChessAppState;
        
        // Validate the stored state
        if (!storedState.session.isActive) {
          console.warn('Stored session is invalid');
          return false;
        }
        
        // Manually update state properties to avoid type issues
        dispatch({ type: 'START_SESSION' });
        
        if (storedState.currentPuzzle) {
          dispatch({ 
            type: 'SET_CURRENT_PUZZLE', 
            payload: storedState.currentPuzzle 
          });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load stored session:', error);
      return false;
    }
  }, []);

  // Clear stored session
  const clearStoredSession = useCallback(async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
      dispatch({ type: 'END_SESSION' });
      return true;
    } catch (error) {
      console.error('Failed to clear stored session:', error);
      return false;
    }
  }, []);

  return (
    <AppStateContext.Provider value={{ state, dispatch, loadStoredSession, clearStoredSession }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook for using the app state
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
