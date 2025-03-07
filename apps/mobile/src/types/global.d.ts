/**
 * Global type declarations for the Chess Woodpecker app
 */

// Global type definitions for the app
declare global {
  // Debug functions exposed to the global scope
  var debugPuzzleCache: () => Promise<void>;
  var clearPuzzleCache: () => Promise<void>;
}

// This is necessary to make this file a module
export {}; 