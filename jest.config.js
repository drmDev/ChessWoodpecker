/** @type {import('jest').Config} */
module.exports = {
  // Use a preset that works with React Native
  preset: 'jest-expo',
  
  // Add these cache configurations
  cacheDirectory: '.jest-cache',
  cache: true,
  
  // Limit the number of workers on CI
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Add test environment setup timeout
  testEnvironmentOptions: {
    setupTimeout: 10000
  },
  
  // Transform files with babel
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // Handle module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Setup files to run before tests
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Test environment
  testEnvironment: 'node',

  // Projects configuration for monorepo
  projects: [
    '<rootDir>/apps/mobile/jest.config.js',
  ],

  // Transform node_modules that use TypeScript
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|@expo|expo|@react-native/js-polyfills))'
  ],

  // Root directory
  rootDir: './',

  // Test path ignore patterns
  testPathIgnorePatterns: ['/node_modules/'],
}; 
