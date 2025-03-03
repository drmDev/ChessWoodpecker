import * as FileSystem from 'expo-file-system';
import { getPuzzlePosition } from '../models/PuzzleModel';
import { LichessPuzzleResponse } from '../models/PuzzleModel';
import { Chess } from 'chess.js';

// Define the structure of a cached puzzle
export interface CachedPuzzle {
  id: string;
  pgn: string;
  initialFen: string;
  initialPly: number;
  solution: string[];
}

// Define the structure of the cache file
interface PuzzleCache {
  puzzles: {
    [id: string]: CachedPuzzle;
  };
}

// Path constants
const CACHE_DIRECTORY = `${FileSystem.documentDirectory}puzzlecache`;
const CACHE_FILE_PATH = `${CACHE_DIRECTORY}/cached_puzzles.json`;

/**
 * Initialize the cache directory and file if they don't exist
 */
export async function initializeCache(): Promise<void> {
  try {
    // Check if the cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true });
    }

    // Check if the cache file exists
    const fileInfo = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
    if (!fileInfo.exists) {
      // Create an empty cache file
      await FileSystem.writeAsStringAsync(
        CACHE_FILE_PATH,
        JSON.stringify({ puzzles: {} })
      );
    }
  } catch (error) {
    console.error('Error initializing puzzle cache:', error);
  }
}

/**
 * Get all cached puzzles
 * @returns An object with puzzle ids as keys and cached puzzles as values
 */
export async function getCachedPuzzles(): Promise<{ [id: string]: CachedPuzzle }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
    if (!fileInfo.exists) {
      return {};
    }

    const fileContents = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
    const cache: PuzzleCache = JSON.parse(fileContents);
    return cache.puzzles;
  } catch (error) {
    console.error('Error reading cached puzzles:', error);
    return {};
  }
}

/**
 * Get a puzzle from the cache by ID
 * @param id The puzzle ID
 * @returns The cached puzzle or null if not found
 */
export async function getCachedPuzzle(id: string): Promise<CachedPuzzle | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
    if (!fileInfo.exists) {
      return null;
    }

    const fileContents = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
    const cache: PuzzleCache = JSON.parse(fileContents);
    
    return cache.puzzles[id] || null;
  } catch (error) {
    console.error('Error reading cached puzzle:', error);
    return null;
  }
}

/**
 * Save the puzzles cache to file
 * @param puzzles The puzzles to save
 */
export async function saveCachedPuzzles(puzzles: { [id: string]: CachedPuzzle }): Promise<void> {
  try {
    // Ensure cache directory exists
    await initializeCache();
    
    await FileSystem.writeAsStringAsync(
      CACHE_FILE_PATH,
      JSON.stringify({ puzzles })
    );
  } catch (error) {
    console.error('Error saving cached puzzles:', error);
  }
}

/**
 * Extract the essential data from a Lichess puzzle response
 * @param response The Lichess API response
 * @returns A minimal cached puzzle object
 */
function extractPuzzleData(response: LichessPuzzleResponse): CachedPuzzle {
  const { chess, fen } = getPuzzlePosition(
    response.game.pgn,
    response.puzzle.initialPly
  );
  
  return {
    id: response.puzzle.id,
    pgn: response.game.pgn,
    initialFen: fen,
    initialPly: response.puzzle.initialPly,
    solution: response.puzzle.solution
  };
}

/**
 * Add a puzzle to the cache
 * @param response The Lichess API response
 */
export async function addPuzzleToCache(response: LichessPuzzleResponse): Promise<void> {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    // Get current cache
    const puzzles = await getCachedPuzzles();
    
    // Extract and add the new puzzle
    const puzzleData = extractPuzzleData(response);
    puzzles[puzzleData.id] = puzzleData;
    
    // Save updated cache
    await saveCachedPuzzles(puzzles);
  } catch (error) {
    console.error('Error adding puzzle to cache:', error);
  }
}

/**
 * Clear the puzzle cache
 */
export async function clearCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(CACHE_FILE_PATH, { idempotent: true });
  } catch (error) {
    console.error('Error clearing puzzle cache:', error);
  }
}

/**
 * Add multiple puzzles to the cache
 * @param responses Array of Lichess API responses
 */
export async function addMultiplePuzzlesToCache(responses: LichessPuzzleResponse[]): Promise<void> {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    // Get current cache
    const puzzles = await getCachedPuzzles();
    
    // Extract and add all new puzzles
    for (const response of responses) {
      const puzzleData = extractPuzzleData(response);
      puzzles[puzzleData.id] = puzzleData;
    }
    
    // Save updated cache
    await saveCachedPuzzles(puzzles);
  } catch (error) {
    console.error('Error adding multiple puzzles to cache:', error);
  }
}

/**
 * Get or fetch a puzzle by ID
 * First tries to get the puzzle from cache, 
 * if not found, fetches it from the API and adds it to cache
 * @param id The puzzle ID
 * @param fetchFunction A function that fetches the puzzle from the API
 * @returns The puzzle data or null if not found
 */
export async function getOrFetchPuzzle(
  id: string, 
  fetchFunction: (id: string) => Promise<LichessPuzzleResponse>
): Promise<CachedPuzzle | null> {
  try {
    // Try to get from cache first
    const cachedPuzzle = await getCachedPuzzle(id);
    if (cachedPuzzle) {
      return cachedPuzzle;
    }
    
    // If not in cache, fetch from API
    const apiResponse = await fetchFunction(id);
    
    // Add to cache
    await addPuzzleToCache(apiResponse);
    
    // Return the extracted data
    return extractPuzzleData(apiResponse);
  } catch (error) {
    console.error(`Error getting or fetching puzzle ${id}:`, error);
    return null;
  }
} 