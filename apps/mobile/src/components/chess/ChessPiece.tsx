import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// Chess piece image mapping
const PIECE_IMAGES: Record<string, any> = {
  'w-p': require('../../../assets/pieces/wp.png'),
  'w-n': require('../../../assets/pieces/wn.png'),
  'w-b': require('../../../assets/pieces/wb.png'),
  'w-r': require('../../../assets/pieces/wr.png'),
  'w-q': require('../../../assets/pieces/wq.png'),
  'w-k': require('../../../assets/pieces/wk.png'),
  'b-p': require('../../../assets/pieces/bp.png'),
  'b-n': require('../../../assets/pieces/bn.png'),
  'b-b': require('../../../assets/pieces/bb.png'),
  'b-r': require('../../../assets/pieces/br.png'),
  'b-q': require('../../../assets/pieces/bq.png'),
  'b-k': require('../../../assets/pieces/bk.png'),
};

export interface ChessPieceProps {
  square: string;
  piece: string | null;
  gesture: ReturnType<typeof Gesture.Pan>;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  gesture,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Compose the gesture with visual feedback
  const pieceGesture = Gesture.Simultaneous(
    gesture,
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!piece) return null;

  return (
    <GestureDetector gesture={pieceGesture}>
      <Animated.View style={[styles.piece, animatedStyle]}>
        <Image 
          source={PIECE_IMAGES[piece]}
          style={styles.pieceImage}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  piece: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  pieceImage: {
    height: '85%',
    width: '85%',
  },
}); 