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
      
      if (cached) {
        const puzzle = JSON.parse(cached) as Puzzle;
        return puzzle;
      }
      
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Store a puzzle in cache
   */
  static async storePuzzle(puzzle: Puzzle): Promise<void> {
    try {
      const puzzleJson = JSON.stringify(puzzle);
      await AsyncStorage.setItem(`${PUZZLE_CACHE_PREFIX}${puzzle.id}`, puzzleJson);
    } catch (_e) {
      throw _e;
    }
  }

  /**
   * Clear the puzzle cache
   */
  static async clearCache(): Promise<void> {
    try {
      console.info(`Clearing puzzle cache`);
      const _startTime = Date.now();
      
      // Get all keys for puzzles
      const keys = await AsyncStorage.getAllKeys();
      const puzzleKeys = keys.filter((_key) => _key.startsWith(PUZZLE_CACHE_PREFIX));
      
      // Track what we're removing
      const removedItems = [];
      
      // Remove puzzle cache entries if any exist
      if (puzzleKeys.length > 0) {
        await AsyncStorage.multiRemove(puzzleKeys);
        removedItems.push(`${puzzleKeys.length} puzzle cache entries`);
      }
      
      console.info(`Cache clearing completed successfully`, { 
        removedItems,
        durationMs: Date.now() - _startTime
      });
    } catch (_) {
      // Handle error silently
    }
  }

  /**
   * Debug function to inspect the puzzle cache
   */
  static async debugInspectCache(): Promise<void> {
    try {
      console.info(`Inspecting puzzle cache`);
      const _startTime = Date.now();
      
      const keys = await AsyncStorage.getAllKeys();
      const puzzleKeys = keys.filter(key => key.startsWith(PUZZLE_CACHE_PREFIX));
      
      console.info(`Puzzle cache statistics`, { 
        totalKeys: puzzleKeys.length,
        allStorageKeys: keys.length
      });
      
      if (puzzleKeys.length > 0) {
        const puzzles = await AsyncStorage.multiGet(puzzleKeys);
        
        // Calculate total size and theme distribution
        let totalSize = 0;
        const themeDistribution: Record<string, number> = {};
        
        puzzles.forEach(([_, value]) => {
          if (value) {
            totalSize += value.length;
            
            try {
              const puzzle = JSON.parse(value) as Puzzle;
              const theme = puzzle.theme || 'Unknown';
              
              themeDistribution[theme] = (themeDistribution[theme] || 0) + 1;
            } catch (_) {
              // Skip invalid JSON
            }
          }
        });
        
        console.info(`Puzzle cache details`, {
          totalSizeBytes: totalSize,
          averagePuzzleSizeBytes: totalSize / puzzles.length,
          themeDistribution,
          durationMs: Date.now() - _startTime
        });
      } else {
        console.info(`Puzzle cache is empty`);
      }
    } catch (error) {
      console.error(`Error inspecting puzzle cache`, error);
    }
  }

  /**
   * Get all cached puzzle IDs
   */
  static async getCachedPuzzleIds(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(PUZZLE_CACHE_PREFIX))
        .map(key => key.replace(PUZZLE_CACHE_PREFIX, ''));
    } catch (error) {
      console.error(`Error getting cached puzzle IDs`, error);
      return [];
    }
  }
}

// Set up global debug functions
global.debugPuzzleCache = PuzzleCacheService.debugInspectCache;
global.clearPuzzleCache = PuzzleCacheService.clearCache; 