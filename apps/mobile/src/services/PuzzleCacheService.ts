import AsyncStorage from '@react-native-async-storage/async-storage';
import { Puzzle } from '../models/PuzzleModel';

const PUZZLE_CACHE_PREFIX = 'puzzle_';

// Expose debug functions to global scope
declare global {
  var debugPuzzleCache: () => Promise<void>;
  var clearPuzzleCache: () => Promise<void>;
}

export class PuzzleCacheService {
  /**
   * Get a puzzle from cache
   */
  static async getPuzzle(id: string): Promise<Puzzle | null> {
    try {
      const cached = await AsyncStorage.getItem(`${PUZZLE_CACHE_PREFIX}${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Store a puzzle in cache
   */
  static async storePuzzle(puzzle: Puzzle): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${PUZZLE_CACHE_PREFIX}${puzzle.id}`,
        JSON.stringify(puzzle)
      );
    } catch (_error) {
      // Silently handle storage errors
    }
  }

  /**
   * Clear all puzzles from cache
   */
  static async clearCache(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      const puzzleKeys = keys.filter(key => key.startsWith(PUZZLE_CACHE_PREFIX));
      
      if (puzzleKeys.length === 0) {
        console.log('🧩 Cache is already empty');
        return;
      }
      
      // Remove all puzzle entries
      await AsyncStorage.multiRemove(puzzleKeys);
      console.log(`🧩 Cleared ${puzzleKeys.length} puzzles from cache`);
    } catch (error) {
      console.error('[PuzzleCacheService] Error clearing cache:', error);
      throw new Error('Failed to clear puzzle cache');
    }
  }

  /**
   * Debug function to inspect cache contents
   */
  static async debugInspectCache(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      const puzzleKeys = keys.filter(key => key.startsWith(PUZZLE_CACHE_PREFIX));
      
      if (puzzleKeys.length === 0) {
        console.log('🧩 Cache is empty');
        return;
      }
      
      // Get all puzzle data
      const cacheData = await AsyncStorage.multiGet(puzzleKeys);
      
      // Log each puzzle in a readable format
      console.log('🧩 Puzzle Cache Contents:');
      cacheData.forEach(([key, value]) => {
        const puzzle = value ? JSON.parse(value) : null;
        console.log(`\nPuzzle: ${key.replace(PUZZLE_CACHE_PREFIX, '')}`);
        console.log('Data:', puzzle);
      });
    } catch (_error) {
      console.error('[PuzzleCacheService] Error inspecting cache:', _error);
    }
  }
}

// Expose debug functions to global scope
global.debugPuzzleCache = async () => {
  await PuzzleCacheService.debugInspectCache();
};

global.clearPuzzleCache = async () => {
  await PuzzleCacheService.clearCache();
}; 