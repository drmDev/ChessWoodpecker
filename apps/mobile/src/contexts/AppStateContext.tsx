import React, { createContext, useContext, useReducer } from 'react';
import { SessionData } from '../components/session/SessionManager';

// Define action types
type AppAction = 
  | { type: 'START_SESSION'; payload: SessionData }
  | { type: 'END_SESSION' }
  | { type: 'UPDATE_SESSION'; payload: Partial<SessionData> }
  | { type: 'UPDATE_SESSION_TIME_DELTA'; payload: number }
  | { type: 'TOGGLE_THEME' };

// Define state type
interface AppState {
  sessionData: SessionData | null;
  theme: 'light' | 'dark';
}

// Create context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Initial state
const initialState: AppState = {
  sessionData: null,
  theme: 'light'
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        sessionData: action.payload
      };
    case 'END_SESSION':
      return {
        ...state,
        sessionData: null
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessionData: state.sessionData ? {
          ...state.sessionData,
          ...action.payload
        } : null
      };
    case 'UPDATE_SESSION_TIME_DELTA':
      return {
        ...state,
        sessionData: state.sessionData ? {
          ...state.sessionData,
          elapsedTime: state.sessionData.elapsedTime + action.payload
        } : null
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
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
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