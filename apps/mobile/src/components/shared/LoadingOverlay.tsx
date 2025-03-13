import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { PuzzleSetupState } from 'src/contexts/AppStateContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  minDisplayTime?: number;
  fadeTransitionDuration?: number;
  setupState: PuzzleSetupState;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading...', 
  minDisplayTime = 1000,
  fadeTransitionDuration = 300,
  setupState
}: LoadingOverlayProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isDisplayed, setIsDisplayed] = useState(false);

  // Create separate animation values for each transform
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Handle fade animations (unchanged from before)
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    
    if (visible) {
      setIsDisplayed(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeTransitionDuration,
        useNativeDriver: true,
      }).start();
    } else {
      hideTimeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: fadeTransitionDuration,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setIsDisplayed(false);
          }
        });
      }, minDisplayTime);
    }

    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [visible, minDisplayTime, fadeTransitionDuration]);

  // Enhanced knight animation
  useEffect(() => {
    if (isDisplayed) {
      // Rotation animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Scale animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      // Reset animations on cleanup
      rotateAnim.setValue(0);
      bounceAnim.setValue(0);
      scaleAnim.setValue(1);
    };
  }, [isDisplayed]);

  // Add setup state-specific animations
  useEffect(() => {
    if (setupState === 'SETUP_IN_PROGRESS') {
      // Enhance animations during setup
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true
          })
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.linear,
              useNativeDriver: true
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true
            })
          ])
        )
      ]).start();
    }
  }, [setupState, scaleAnim, rotateAnim]);

  // Interpolate animations for smooth transitions
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20], // Bounce up to 20 units
  });

  if (!isDisplayed) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: `${theme.background}CC`,
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.content}>
        <Animated.View 
          style={{ 
            transform: [
              { rotate },
              { translateY },
              { scale: scaleAnim }
            ],
            // Add shadow to make the knight "float"
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <FontAwesome5 
            name="chess-knight" 
            size={48} 
            color={theme.primary} 
          />
        </Animated.View>
        <Text style={[styles.message, { color: theme.text }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
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
