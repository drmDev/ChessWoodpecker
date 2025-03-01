/**
 * Utility functions for parsing puzzle collections
 */

export interface Puzzle {
  id: string;
}

export interface PuzzleCategory {
  name: string;
  puzzles: Puzzle[];
}

export interface PuzzleCollection {
  version: string;
  name?: string;
  categories: PuzzleCategory[];
}

/**
 * Parses a text format of puzzles into a structured PuzzleCollection
 * 
 * Expected format:
 * CATEGORY NAME
 * https://lichess.org/training/puzzleId1
 * https://lichess.org/training/puzzleId2
 * 
 * ANOTHER CATEGORY
 * https://lichess.org/training/puzzleId3
 * 
 * @param text The text content to parse
 * @param collectionName Optional name for the collection
 * @returns A structured PuzzleCollection object
 */
export function parseTextFormat(text: string, collectionName?: string): PuzzleCollection {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const categories: PuzzleCategory[] = [];
  let currentCategory: PuzzleCategory | null = null;
  
  for (const line of lines) {
    // Check if this is a category line (doesn't start with http)
    if (!line.startsWith('http')) {
      // New category - clean up the name (remove parentheses if present)
      const categoryName = line.replace(/^\(|\)$/g, '').trim();
      
      // Save previous category if it exists
      if (currentCategory && currentCategory.puzzles.length > 0) {
        categories.push(currentCategory);
      }
      
      // Create new category
      currentCategory = {
        name: categoryName,
        puzzles: []
      };
    } else if (line.startsWith('https://lichess.org/training/') && currentCategory) {
      // Extract puzzle ID from URL
      const id = line.split('/').pop() || '';
      if (id) {
        currentCategory.puzzles.push({ id });
      }
    }
  }
  
  // Add the last category if it exists
  if (currentCategory && currentCategory.puzzles.length > 0) {
    categories.push(currentCategory);
  }
  
  return {
    version: "1.0",
    name: collectionName,
    categories
  };
}

/**
 * Extracts the puzzle ID from a Lichess puzzle URL
 * 
 * @param url The Lichess puzzle URL
 * @returns The puzzle ID or null if invalid
 */
export function extractPuzzleId(url: string): string | null {
  if (!url.startsWith('https://lichess.org/training/')) {
    return null;
  }
  
  return url.split('/').pop() || null;
} 