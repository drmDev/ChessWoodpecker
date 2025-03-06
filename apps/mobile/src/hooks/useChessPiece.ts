import { useCallback } from 'react';
import { useSharedValue, withSpring, useAnimatedStyle, AnimatedStyle } from 'react-native-reanimated';
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

/**
 * Hook to manage chess piece movement and animation
 * Handles drag gestures and visual feedback
 */
export function useChessPiece({ baseGesture }: UseChessPieceProps): UseChessPieceResult {
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

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
          scale.value = withSpring(1.1);
        })
        .onFinalize(() => {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          scale.value = withSpring(1);
        })
    );
  }, [baseGesture, translateX, translateY, scale]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return {
    animatedStyle,
    pieceGesture: createPieceGesture(),
  };
} 