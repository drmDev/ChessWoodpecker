import { renderHook, act } from '@testing-library/react-hooks';
import { useChessBoard } from '../useChessBoard';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const createChainableMock = () => {
    const mock = {
      onBegin: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
    };
    return mock;
  };

  return {
    Gesture: {
      Pan: () => createChainableMock(),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const mockSharedValue = (initial: any) => ({
    value: initial,
  });

  const mockWithTiming = (toValue: number, config: any, callback?: (finished: boolean) => void) => {
    if (callback) {
      callback(true);
    }
    return toValue;
  };

  const mockRunOnJS = (fn: Function) => fn;

  const mockUseAnimatedStyle = (fn: () => any) => {
    return fn();
  };

  return {
    useSharedValue: mockSharedValue,
    withTiming: mockWithTiming,
    runOnJS: mockRunOnJS,
    useAnimatedStyle: mockUseAnimatedStyle,
  };
});

// Mock Dimensions
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 400, height: 800 }),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
}));

// Mock playSound
jest.mock('../../utils/sounds', () => ({
  playSound: jest.fn(),
}));

// Mock mapCoordinatesToSquare
jest.mock('../../utils/chess/orientation-utils', () => ({
  mapCoordinatesToSquare: jest.fn().mockReturnValue('e4'),
}));

describe('useChessBoard', () => {
  const defaultProps = {
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    orientation: 'white' as const,
    onMove: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct board size', () => {
    const { result } = renderHook(() => useChessBoard(defaultProps));

    expect(result.current.boardSize).toBe(400);
    expect(result.current.squareSize).toBe(50);
  });

  it('should initialize with correct position from FEN', () => {
    const { result } = renderHook(() => useChessBoard(defaultProps));

    expect(Object.keys(result.current.position).length).toBe(32);
    expect(result.current.position.e2).toEqual({ type: 'p', color: 'w' });
    expect(result.current.position.e7).toEqual({ type: 'p', color: 'b' });
  });

  it('should handle valid move', () => {
    const { result } = renderHook(() => useChessBoard(defaultProps));

    act(() => {
      const success = result.current.handleMove('e2', 'e4');
      expect(success).toBe(true);
    });

    // Wait for animation timeout
    jest.advanceTimersByTime(300);

    expect(result.current.lastMove).toEqual({ from: 'e2', to: 'e4' });
    expect(defaultProps.onMove).toHaveBeenCalledWith('e2', 'e4');
  });

  it('should handle invalid move', () => {
    const { result } = renderHook(() => useChessBoard(defaultProps));

    act(() => {
      const success = result.current.handleMove('e2', 'e5');
      expect(success).toBe(false);
    });

    expect(result.current.lastMove).toBeNull();
    expect(defaultProps.onMove).not.toHaveBeenCalled();
  });

  it('should calculate square coordinates correctly', () => {
    const { result } = renderHook(() => useChessBoard(defaultProps));

    const coords = result.current.getSquareCoordinates('e4');
    expect(coords).toEqual({ x: 200, y: 200 });
  });

  it('should calculate square coordinates correctly with black orientation', () => {
    const { result } = renderHook(() => useChessBoard({
      ...defaultProps,
      orientation: 'black',
    }));

    const coords = result.current.getSquareCoordinates('e4');
    expect(coords).toEqual({ x: 150, y: 150 });
  });
}); 