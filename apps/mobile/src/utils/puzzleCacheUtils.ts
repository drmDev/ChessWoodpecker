import defaultCollection from '../../assets/puzzles/default-collection.json';
import { addPuzzleToCache, getCachedPuzzle, initializeCache } from '../services/PuzzleCacheService';
import { LichessPuzzleResponse } from '../models/PuzzleModel';

/**
 * Flattens the default puzzle collection into a single array of puzzle IDs
 * @returns Array of all puzzle IDs in the default collection
 */
export function getAllDefaultPuzzleIds(): string[] {
  const allIds: string[] = [];
  
  // Default collection is organized by category
  Object.values(defaultCollection).forEach(categoryPuzzles => {
    if (Array.isArray(categoryPuzzles)) {
      allIds.push(...categoryPuzzles);
    }
  });
  
  return allIds;
}

/**
 * Get all puzzle IDs for a specific category
 * @param category The puzzle category name
 * @returns Array of puzzle IDs for that category
 */
export function getPuzzleIdsByCategory(category: string): string[] {
  // @ts-ignore - defaultCollection may have keys that are not in the type
  return defaultCollection[category] || [];
}

/**
 * Get a random puzzle ID from the default collection
 * @param category Optional category to select from
 * @returns A random puzzle ID
 */
export function getRandomPuzzleId(category?: string): string {
  const puzzleIds = category 
    ? getPuzzleIdsByCategory(category) 
    : getAllDefaultPuzzleIds();
    
  if (puzzleIds.length === 0) {
    throw new Error(`No puzzles found${category ? ` for category ${category}` : ''}`);
  }
  
  const randomIndex = Math.floor(Math.random() * puzzleIds.length);
  return puzzleIds[randomIndex];
}

/**
 * Checks if a puzzle is already cached
 * @param id Puzzle ID
 * @returns True if the puzzle is in the cache
 */
export async function isPuzzleCached(id: string): Promise<boolean> {
  const puzzle = await getCachedPuzzle(id);
  return puzzle !== null;
}

/**
 * Pre-caches specific puzzles for testing or offline use
 * @param ids Array of puzzle IDs to cache
 * @param fetchPuzzle Function to fetch a puzzle from API
 * @returns Number of puzzles successfully cached
 */
export async function preCachePuzzles(
  ids: string[], 
  fetchPuzzle: (id: string) => Promise<LichessPuzzleResponse>
): Promise<number> {
  await initializeCache();
  
  let successCount = 0;
  
  for (const id of ids) {
    try {
      // Only fetch if not already cached
      if (!(await isPuzzleCached(id))) {
        const puzzleResponse = await fetchPuzzle(id);
        await addPuzzleToCache(puzzleResponse);
        successCount++;
      } else {
        // Count already cached puzzles as success
        successCount++;
      }
    } catch (error) {
      console.error(`Failed to cache puzzle ${id}:`, error);
    }
  }
  
  return successCount;
}

/**
 * Utility to pre-cache all puzzles in the default collection
 * This can be used during app initialization for offline support
 * @param fetchPuzzle Function to fetch a puzzle from API
 * @returns Total number of puzzles cached
 */
export async function preCacheAllDefaultPuzzles(
  fetchPuzzle: (id: string) => Promise<LichessPuzzleResponse>
): Promise<number> {
  const allIds = getAllDefaultPuzzleIds();
  return await preCachePuzzles(allIds, fetchPuzzle);
} 