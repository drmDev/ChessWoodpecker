import { useCallback } from 'react';
import { useSharedValue, withSpring, useAnimatedStyle, AnimatedStyle, Easing, withTiming } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

interface ChessPieceAnimation {
  translateX: number;
  translateY: number;
  scale: number;
}

interface UseChessPieceProps {
  baseGesture: ReturnType<typeof Gesture.Pan>;
}

interface UseChessPieceResult {
  animatedStyle: AnimatedStyle;
  pieceGesture: ReturnType<typeof Gesture.Simultaneous>;
}

// Spring configuration for smoother animations
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01
};

/**
 * Hook to manage chess piece movement and animation
 * Handles drag gestures and visual feedback
 */
export function useChessPiece({ baseGesture }: UseChessPieceProps): UseChessPieceResult {
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const elevation = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Create the gesture handler
  const createPieceGesture = useCallback(() => {
    return Gesture.Simultaneous(
      baseGesture,
      Gesture.Pan()
        .onChange((event) => {
          // Smooth tracking during drag
          translateX.value = event.translationX;
          translateY.value = event.translationY;
        })
        .onBegin(() => {
          // Smooth pickup animation
          scale.value = withSpring(1.1, SPRING_CONFIG);
          elevation.value = withSpring(10, SPRING_CONFIG);
          opacity.value = withTiming(0.9, { duration: 150, easing: Easing.ease });
        })
        .onFinalize(() => {
          // Smooth release animation with natural bounce
          translateX.value = withSpring(0, SPRING_CONFIG);
          translateY.value = withSpring(0, SPRING_CONFIG);
          scale.value = withSpring(1, SPRING_CONFIG);
          elevation.value = withSpring(1, SPRING_CONFIG);
          opacity.value = withTiming(1, { duration: 200, easing: Easing.ease });
        })
    );
  }, [baseGesture, translateX, translateY, scale, elevation, opacity]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    elevation: elevation.value,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation.value / 2 },
    shadowOpacity: 0.3,
    shadowRadius: elevation.value,
    opacity: opacity.value,
    zIndex: elevation.value > 1 ? 100 : 1,
  }));

  return {
    animatedStyle,
    pieceGesture: createPieceGesture(),
  };
}