import { renderHook, act } from '@testing-library/react-hooks';
import { useSessionStats } from '../useSessionStats';
import { useAppState } from '../../contexts/AppStateContext';

// Mock the AppState context
jest.mock('../../contexts/AppStateContext', () => ({
  useAppState: jest.fn()
}));

describe('useSessionStats', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should return inactive state when no session exists', () => {
    // Mock the AppState hook to return no session
    (useAppState as jest.Mock).mockReturnValue({
      state: { sessionData: null }
    });

    const { result } = renderHook(() => useSessionStats());

    expect(result.current).toEqual({
      isActive: false,
      elapsedTime: 0,
      isCollapsed: true,
      toggleCollapsed: expect.any(Function)
    });
  });

  it('should return active state with elapsed time when session exists', () => {
    // Mock the AppState hook to return an active session
    (useAppState as jest.Mock).mockReturnValue({
      state: {
        sessionData: {
          elapsedTime: 1234
        }
      }
    });

    const { result } = renderHook(() => useSessionStats());

    expect(result.current).toEqual({
      isActive: true,
      elapsedTime: 1234,
      isCollapsed: true,
      toggleCollapsed: expect.any(Function)
    });
  });

  it('should toggle collapsed state', () => {
    // Mock the AppState hook
    (useAppState as jest.Mock).mockReturnValue({
      state: { sessionData: null }
    });

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

  it('should memoize stats when session data has not changed', () => {
    const mockState = {
      sessionData: {
        elapsedTime: 1234
      }
    };

    // Mock the AppState hook
    (useAppState as jest.Mock).mockReturnValue({
      state: mockState
    });

    const { result, rerender } = renderHook(() => useSessionStats());
    const firstResult = result.current;

    // Rerender with the same state
    rerender();

    // The stats object should be the same instance (memoized)
    expect(result.current).toBe(firstResult);
  });
}); 