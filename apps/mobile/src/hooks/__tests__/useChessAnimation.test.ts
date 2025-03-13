import { renderHook } from '@testing-library/react-hooks';
import { useChessAnimation } from '../useChessAnimation';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: () => ({}),
  withTiming: (toValue: number) => toValue,
}));

describe('useChessAnimation', () => {
  it('should return animation controls and style', () => {
    const { result } = renderHook(() => useChessAnimation(50));

    expect(result.current.animX).toBeDefined();
    expect(result.current.animY).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.startDragAnimation).toBeDefined();
    expect(result.current.endDragAnimation).toBeDefined();
    expect(result.current.resetAnimation).toBeDefined();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useChessAnimation(50));

    expect(result.current.animX.value).toBe(0);
    expect(result.current.animY.value).toBe(0);
    expect(result.current.animScale.value).toBe(1);
    expect(result.current.animOpacity.value).toBe(1);
    expect(result.current.animElevation.value).toBe(1);
  });
});