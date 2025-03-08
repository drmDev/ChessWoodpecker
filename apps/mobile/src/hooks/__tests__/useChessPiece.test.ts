import { renderHook } from '@testing-library/react-hooks';
import { useChessPiece } from '../useChessPiece';
import { Gesture } from 'react-native-gesture-handler';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const createChainableMock = () => {
    const mock = {
      onChange: () => mock,
      onBegin: () => mock,
      onFinalize: () => mock,
    };
    return mock;
  };

  return {
    Gesture: {
      Pan: () => createChainableMock(),
      Simultaneous: () => createChainableMock(),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const mockSharedValue = (initial: any) => ({
    value: initial,
  });

  const mockWithSpring = (toValue: number) => toValue;
  
  const mockWithTiming = (toValue: number, config?: any) => toValue;

  const mockAnimatedStyle = () => ({
    transform: [
      { translateX: 0 },
      { translateY: 0 },
      { scale: 1 },
    ]
  });

  return {
    useSharedValue: mockSharedValue,
    withSpring: mockWithSpring,
    withTiming: mockWithTiming,
    useAnimatedStyle: () => mockAnimatedStyle(),
    Easing: {
      bezier: () => 'mocked-easing-function',
      ease: 'mocked-ease-function'
    },
    default: {
      View: 'Animated.View',
    },
  };
});

describe('useChessPiece', () => {
  const mockBaseGesture = Gesture.Pan();

  it('should initialize with correct animated style', () => {
    const { result } = renderHook(() => useChessPiece({ baseGesture: mockBaseGesture }));

    // We can only test that the style object exists since actual values are managed by reanimated
    expect(result.current.animatedStyle).toBeDefined();
  });

  it('should return a gesture handler', () => {
    const { result } = renderHook(() => useChessPiece({ baseGesture: mockBaseGesture }));

    expect(result.current.pieceGesture).toBeDefined();
    // We can't test the specific gesture methods as they're internal to the gesture handler
    expect(result.current.pieceGesture).toBeInstanceOf(Object);
  });
}); 