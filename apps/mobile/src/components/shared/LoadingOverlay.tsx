import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  // Minimum time in milliseconds that the overlay should remain visible
  // This helps ensure smooth transitions and prevents flickering
  minDisplayTime?: number;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading next puzzle...', 
  // Default to 1000ms (1 second) minimum display time
  minDisplayTime = 1000 
}: LoadingOverlayProps) {
  const { theme } = useTheme();
  const pulseAnim = new Animated.Value(1);
  
  // Track whether we're actually showing the overlay
  // This helps us implement the minimum display time logic
  const [isDisplayed, setIsDisplayed] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (visible) {
      // When visible prop becomes true, show immediately
      setIsDisplayed(true);
    } else {
      // When visible prop becomes false, wait for minimum display time
      // before actually hiding the overlay
      timeoutId = setTimeout(() => {
        setIsDisplayed(false);
      }, minDisplayTime);
    }

    // Cleanup timeout on unmount or when visible changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [visible, minDisplayTime]);

  useEffect(() => {
    // Only run animation when the overlay is actually displayed
    if (isDisplayed) {
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
  }, [isDisplayed]);

  // Don't render anything if we're not displayed
  if (!isDisplayed) return null;

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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
});
