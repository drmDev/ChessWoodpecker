import React from 'react';
// StatusBar is a component that displays the status bar of the device.
// It is used to display the status bar of the device and to ensure that the status bar is properly displayed.
import { StatusBar } from 'expo-status-bar';
// GestureHandlerRootView is a component that provides a central container for handling gestures and events.
// It is used to wrap the root component of the application and ensure that all gestures and events are properly handled.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// ThemeProvider is a component that provides the theme to the application.
import { ThemeProvider } from '../shared/contexts/ThemeContext';
// AppNavigator is the main navigator of the application.
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Configure Reanimated to disable strict mode
try {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.error, // Only show errors
    strict: false, // Disable strict mode to prevent warnings
  });
} catch (error) {
  console.warn('Failed to configure Reanimated logger:', error);
}

// The style={{ flex: 1 }} property on the GestureHandlerRootView component is using a fundamental concept from React Native's layout system called Flexbox.
// Flexbox is a layout system that allows you to design complex layouts with ease.
// It provides a way to distribute space among items in a container and align them in various ways.
// The flex: 1 property makes the GestureHandlerRootView component take up the full available space in the parent container.
// This is important for ensuring that the component takes up the entire screen and that its children components are properly positioned. 
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
