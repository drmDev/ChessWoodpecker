// Mock timers for consistent testing
jest.useFakeTimers();

// Silence console.error, console.warn, and console.log during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
global.console.log = jest.fn(); 