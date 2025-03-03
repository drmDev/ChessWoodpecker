// Mock timers for consistent testing
jest.useFakeTimers();

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn().mockResolvedValue(true),
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue({ uri: 'mock-uri' }),
    }),
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: { 
        setPositionAsync: jest.fn().mockResolvedValue(true),
        stopAsync: jest.fn().mockResolvedValue(true),
        playAsync: jest.fn().mockResolvedValue(true),
        unloadAsync: jest.fn().mockResolvedValue(true),
      }}),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(true),
  },
}));

// Mock react-native's Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn(obj => obj.android || obj.default),
}));

// Silence console.error and console.warn during tests
global.console.error = jest.fn();
global.console.warn = jest.fn(); 