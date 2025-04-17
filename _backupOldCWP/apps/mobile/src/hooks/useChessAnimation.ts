import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  SharedValue 
} from 'react-native-reanimated';

const ANIMATION_CONFIG = {
  duration: 150
};

interface ChessAnimationResult {
  animX: SharedValue<number>;
  animY: SharedValue<number>;
  animScale: SharedValue<number>;
  animOpacity: SharedValue<number>;
  animElevation: SharedValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  resetAnimation: () => void;
  startDragAnimation: () => void;
  endDragAnimation: () => void;
}

export function useChessAnimation(squareSize: number): ChessAnimationResult {
  const animX = useSharedValue(0);
  const animY = useSharedValue(0);
  const animScale = useSharedValue(1);
  const animOpacity = useSharedValue(1);
  const animElevation = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: squareSize,
    height: squareSize,
    transform: [
      { translateX: animX.value },
      { translateY: animY.value },
      { scale: animScale.value }
    ],
    opacity: animOpacity.value,
    zIndex: 10,
    elevation: animElevation.value,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: animElevation.value / 2 },
    shadowOpacity: 0.3,
    shadowRadius: animElevation.value,
  }), [squareSize]);

  const resetAnimation = () => {
    animX.value = withTiming(0, ANIMATION_CONFIG);
    animY.value = withTiming(0, ANIMATION_CONFIG);
    animScale.value = withTiming(1, ANIMATION_CONFIG);
    animOpacity.value = withTiming(1, ANIMATION_CONFIG);
    animElevation.value = withTiming(1, ANIMATION_CONFIG);
  };

  const startDragAnimation = () => {
    animScale.value = withTiming(1.1, ANIMATION_CONFIG);
    animOpacity.value = withTiming(0.8, ANIMATION_CONFIG);
    animElevation.value = withTiming(5, ANIMATION_CONFIG);
  };

  const endDragAnimation = () => {
    resetAnimation();
  };

  return {
    animX,
    animY,
    animScale,
    animOpacity,
    animElevation,
    animatedStyle,
    resetAnimation,
    startDragAnimation,
    endDragAnimation,
  };
}