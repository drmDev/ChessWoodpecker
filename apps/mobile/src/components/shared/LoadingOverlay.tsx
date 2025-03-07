import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading next puzzle...' }: LoadingOverlayProps) {
  const { theme } = useTheme();
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.setValue(1);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: `${theme.background}CC` }]}>
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <FontAwesome5 name="chess-knight" size={48} color={theme.primary} />
        </Animated.View>
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
