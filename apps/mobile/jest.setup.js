/* global jest */

// Use lighter mock implementations
jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: () => ({}),
  withTiming: (val) => val,
  useSharedValue: (val) => ({ value: val }),
  withSpring: (val) => val,
}), { virtual: true });

// Use virtual mocks where possible
jest.mock('react-native-gesture-handler', () => ({}), { virtual: true });

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({ downloadAsync: jest.fn() })),
  },
}), { virtual: true });

// Mock Expo AV
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({ sound: { unloadAsync: jest.fn() } })),
    },
    setAudioModeAsync: jest.fn(),
  },
}));  // Initialize these before tests run
jest.useFakeTimers();  // Silence console.error, console.warn, and console.log during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
global.console.log = jest.fn();

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  }
}));
