import { SessionData } from '../components/session/SessionManager';

// Interface for session statistics
export interface SessionStats {
  totalTimeElapsed: number;
  puzzlesAttempted: number;
  puzzlesSolved: number;
  successRate: number;
}

// Interface for a completed session
export interface CompletedSession {
  id: string;
  startTime: number;
  endTime: number;
  totalTimeElapsed: number;
  puzzlesAttempted: number;
  puzzlesSolved: number;
}

// In-memory storage for sessions (in a real app, this would use AsyncStorage or a database)
let currentSession: SessionData | null = null;
const completedSessions: CompletedSession[] = [];

/**
 * Updates the current session data
 */
export const updateCurrentSession = (sessionData: SessionData): void => {
  currentSession = sessionData;
};

/**
 * Completes the current session and stores it
 */
export const completeSession = (
  puzzlesAttempted: number = 0, 
  puzzlesSolved: number = 0
): CompletedSession | null => {
  if (!currentSession || currentSession.state === 'idle') {
    return null;
  }
  
  const completedSession: CompletedSession = {
    id: Date.now().toString(),
    startTime: currentSession.startTime || Date.now(),
    endTime: Date.now(),
    totalTimeElapsed: currentSession.elapsedTime,
    puzzlesAttempted,
    puzzlesSolved
  };
  
  completedSessions.push(completedSession);
  return completedSession;
};

/**
 * Gets all completed sessions
 */
export const getCompletedSessions = (): CompletedSession[] => {
  return [...completedSessions];
};

/**
 * Gets the current session data
 */
export const getCurrentSession = (): SessionData | null => {
  return currentSession;
};

/**
 * Gets session statistics
 */
export const getSessionStats = (): SessionStats => {
  const totalTimeElapsed = completedSessions.reduce(
    (total, session) => total + session.totalTimeElapsed, 
    currentSession?.elapsedTime || 0
  );
  
  const puzzlesAttempted = completedSessions.reduce(
    (total, session) => total + session.puzzlesAttempted, 
    0
  );
  
  const puzzlesSolved = completedSessions.reduce(
    (total, session) => total + session.puzzlesSolved, 
    0
  );
  
  const successRate = puzzlesAttempted > 0 
    ? (puzzlesSolved / puzzlesAttempted) * 100 
    : 0;
  
  return {
    totalTimeElapsed,
    puzzlesAttempted,
    puzzlesSolved,
    successRate
  };
}; 