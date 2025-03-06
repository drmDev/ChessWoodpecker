import { useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppStateContext';

interface SessionStatsData {
  isActive: boolean;
  elapsedTime: number;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

/**
 * Custom hook to manage session statistics logic
 * Separates business logic from UI rendering
 */
export function useSessionStats(): SessionStatsData {
  const { state } = useAppState();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const sessionData = state.sessionData;
  
  // Memoize derived data to prevent unnecessary recalculations
  const stats = useMemo(() => ({
    isActive: sessionData !== null,
    elapsedTime: sessionData?.elapsedTime || 0,
    isCollapsed,
    toggleCollapsed: () => setIsCollapsed(!isCollapsed)
  }), [sessionData, isCollapsed]);

  return stats;
} 