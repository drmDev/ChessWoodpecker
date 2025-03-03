import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface SessionData {
  startTime: number;
  elapsedTime: number;
  endTime?: number;
  state: 'idle' | 'active' | 'paused';
}

interface AppState {
  sessionData: SessionData | null;
  themeMode: 'light' | 'dark';
}

// Action types
type Action =
  | { type: 'START_SESSION'; payload: any[] }
  | { type: 'END_SESSION' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'UPDATE_SESSION_TIME_DELTA'; payload: number };

// Initial state
const initialState: AppState = {
  sessionData: null,
  themeMode: 'light',
};

// Reducer
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        sessionData: {
          startTime: Date.now(),
          elapsedTime: 0,
          state: 'active'
        },
      };
    case 'END_SESSION':
      return {
        ...state,
        sessionData: null
      };
    case 'TOGGLE_THEME':
      return {
        ...state,
        themeMode: state.themeMode === 'light' ? 'dark' : 'light',
      };
    case 'UPDATE_SESSION_TIME_DELTA':
      if (!state.sessionData) return state;
      return {
        ...state,
        sessionData: {
          ...state.sessionData,
          elapsedTime: (state.sessionData.elapsedTime || 0) + action.payload,
        },
      };
    default:
      return state;
  }
};

// Context
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

// Provider
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}; 