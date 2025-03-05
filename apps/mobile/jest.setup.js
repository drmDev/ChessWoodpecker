/* global jest */

// Mock timers for consistent testing
jest.useFakeTimers();

// Silence console.error, console.warn, and console.log during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
global.console.log = jest.fn();

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {});

// Mock Expo Asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(),
    })),
  },
}));

// Mock Expo AV
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({ sound: { unloadAsync: jest.fn() } })),
    },
    setAudioModeAsync: jest.fn(),
  },
})); 