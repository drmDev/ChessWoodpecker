import { SessionData } from '../components/session/SessionManager';

// Interface for a completed session
export interface CompletedSession {
  id: string;
  startTime: number;
  endTime: number;
  totalTimeElapsed: number;
}

// In-memory storage for sessions
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
export const completeSession = (): CompletedSession | null => {
  if (!currentSession || currentSession.state === 'idle') {
    return null;
  }
  
  const completedSession: CompletedSession = {
    id: Date.now().toString(),
    startTime: currentSession.startTime || Date.now(),
    endTime: Date.now(),
    totalTimeElapsed: currentSession.elapsedTime
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