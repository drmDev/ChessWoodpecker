// Mock timers for consistent testing
jest.useFakeTimers();

// Silence console.error and console.warn during tests
global.console.error = jest.fn();
global.console.warn = jest.fn(); 