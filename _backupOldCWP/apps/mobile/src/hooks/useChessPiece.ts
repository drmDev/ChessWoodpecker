import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withTiming, Easing, AnimatedStyle } from 'react-native-reanimated';

interface UseChessPieceProps {
  baseGesture: ReturnType<typeof Gesture.Pan>;
}

interface UseChessPieceResult {
  animatedStyle: AnimatedStyle;
  pieceGesture: ReturnType<typeof Gesture.Simultaneous>;
}

// Timing configuration for more predictable animations
const TIMING_CONFIG = {
  duration: 100,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1)
};

/**
 * Hook to manage chess piece movement and animation
 * Handles drag gestures and visual feedback
 */
export function useChessPiece({ baseGesture }: UseChessPieceProps): UseChessPieceResult {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Create the gesture handler
  const createPieceGesture = useCallback(() => {
    return Gesture.Simultaneous(
      baseGesture,
      Gesture.Pan()
        .onChange((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY;
        })
        .onBegin(() => {
          scale.value = withTiming(1.1, { duration: 50 });
          opacity.value = withTiming(0.8, { duration: 50 });
        })
        .onFinalize(() => {
          // Simply reset the piece position and scale
          translateX.value = withTiming(0, { duration: 100 });
          translateY.value = withTiming(0, { duration: 100 });
          scale.value = withTiming(1, { duration: 50 });
          opacity.value = withTiming(1, { duration: 50 });
        })
    );
  }, [baseGesture, translateX, translateY, scale, opacity]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: scale.value > 1 ? 100 : 1,
  }));

  return {
    animatedStyle,
    pieceGesture: createPieceGesture(),
  };
}
