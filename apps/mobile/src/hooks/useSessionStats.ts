// apps/mobile/src/hooks/useSessionStats.ts
import { useState, useEffect, useCallback } from 'react';
import { SessionStats, SessionData } from '../services/SessionStats';
import { AppState, AppStateStatus } from 'react-native';

export function useSessionStats() {
  // Create a new SessionStats instance
  const [sessionStats] = useState(() => new SessionStats());
  const [sessionData, setSessionData] = useState<SessionData>(sessionStats.getStats());
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && !sessionData.isSessionPaused) {
        // Auto-pause when app goes to background
        await sessionStats.pauseSession(sessionData.currentPuzzleId || '');
        setSessionData(sessionStats.getStats());
      } else if (nextAppState === 'active' && sessionData.isSessionPaused) {
        // Auto-resume when app comes to foreground
        await sessionStats.resumeSession();
        setSessionData(sessionStats.getStats());
      }
    };

    // Subscribe to AppState changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Load any saved session on mount
    const loadSavedSession = async () => {
      const loaded = await sessionStats.loadSession();
      if (loaded) {
        setSessionData(sessionStats.getStats());
      }
    };
    loadSavedSession();

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, [sessionData.isSessionPaused, sessionData.currentPuzzleId, sessionStats]);

  // Function to toggle collapsed state for tests
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const recordAttempt = useCallback(async (
    puzzleMetadata: { id: string; category: string; rating: number },
    success: boolean
  ) => {
    sessionStats.recordPuzzleAttempt(puzzleMetadata, success);
    setSessionData(sessionStats.getStats());
  }, [sessionStats]);

  const pauseSession = useCallback(async (currentPuzzleId: string) => {
    await sessionStats.pauseSession(currentPuzzleId);
    setSessionData(sessionStats.getStats());
  }, [sessionStats]);

  const resumeSession = useCallback(async () => {
    await sessionStats.resumeSession();
    setSessionData(sessionStats.getStats());
  }, [sessionStats]);

  const resetSession = useCallback(async () => {
    await sessionStats.clearSavedSession();
    setSessionData(sessionStats.getStats());
  }, [sessionStats]);

  // Create a return object that satisfies both the tests and implementation
  return {
    // Properties expected by tests
    isActive: sessionData.startTime !== null,
    elapsedTime: sessionStats.getSessionDuration(),
    isCollapsed,
    toggleCollapsed,

    // Original properties from your implementation
    sessionData,
    recordAttempt,
    pauseSession,
    resumeSession,
    resetSession,
    getSuccessRate: useCallback(() => sessionStats.getSuccessRate(), [sessionStats]),
    getCompletedPuzzleIds: useCallback(() => sessionStats.getCompletedPuzzleIds(), [sessionStats]),
    getSuccessfulPuzzleIds: useCallback(() => sessionStats.getSuccessfulPuzzleIds(), [sessionStats]),
    getFailedPuzzleIds: useCallback(() => sessionStats.getFailedPuzzleIds(), [sessionStats]),
    getCategoryStats: useCallback(() => sessionStats.getCategoryStats(), [sessionStats]),
    getSessionDuration: useCallback(() => sessionStats.getSessionDuration(), [sessionStats])
  };
}