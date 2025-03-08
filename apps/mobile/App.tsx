import React, { useEffect } from 'react';
// StatusBar is a component that displays the status bar of the device.
// It is used to display the status bar of the device and to ensure that the status bar is properly displayed.
import { StatusBar } from 'expo-status-bar';
// GestureHandlerRootView is a component that provides a central container for handling gestures and events.
// It is used to wrap the root component of the application and ensure that all gestures and events are properly handled.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// ThemeProvider is a component that provides the theme to the application.
import { ThemeProvider } from './src/contexts/ThemeContext';
// AppStateProvider is a component that provides the application state to the application.
import { AppStateProvider } from './src/contexts/AppStateContext';
// AppNavigator is the main navigator of the application.
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
// Import sound utilities
import { loadSounds, unloadSounds } from './src/utils/sounds';

// Configure Reanimated to disable strict mode
try {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.error, // Only show errors
    strict: false, // Disable strict mode to prevent warnings
  });
} catch (_) {
  // Replace console.warn with a silent catch or console.error if needed
}

// The App component is the main component of the application.
// It is used to wrap the root component of the application and ensure that all gestures and events are properly handled.
export default function App() {
  // Load sounds when the app starts
  useEffect(() => {
    const initSounds = async () => {
      await loadSounds();
    };
    
    initSounds();
    
    // Unload sounds when the app is closed
    return () => {
      unloadSounds();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppStateProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AppStateProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
