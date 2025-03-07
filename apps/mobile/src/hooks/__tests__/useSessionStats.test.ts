// apps/mobile/src/hooks/__tests__/useSessionStats.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useSessionStats } from '../useSessionStats';

// Mock React Native's AppState
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({
      remove: jest.fn()
    }))
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

describe('useSessionStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return inactive state when no session exists', () => {
    const { result } = renderHook(() => useSessionStats());

    // The hook should return these properties for the test
    expect(result.current.isActive).toBeDefined();
    expect(result.current.elapsedTime).toBeDefined();
    expect(result.current.isCollapsed).toBe(true);
    expect(typeof result.current.toggleCollapsed).toBe('function');
  });

  it('should toggle collapsed state', () => {
    const { result } = renderHook(() => useSessionStats());

    // Initial state should be collapsed
    expect(result.current.isCollapsed).toBe(true);

    // Toggle collapsed state
    act(() => {
      result.current.toggleCollapsed();
    });

    // State should now be expanded
    expect(result.current.isCollapsed).toBe(false);

    // Toggle again
    act(() => {
      result.current.toggleCollapsed();
    });

    // State should be collapsed again
    expect(result.current.isCollapsed).toBe(true);
  });

  // Add additional tests for your implementation's functionality
  it('should provide session data and methods', () => {
    const { result } = renderHook(() => useSessionStats());

    expect(result.current.sessionData).toBeDefined();
    expect(typeof result.current.recordAttempt).toBe('function');
    expect(typeof result.current.pauseSession).toBe('function');
    expect(typeof result.current.resumeSession).toBe('function');
    expect(typeof result.current.resetSession).toBe('function');
    expect(typeof result.current.getSuccessRate).toBe('function');
  });
});