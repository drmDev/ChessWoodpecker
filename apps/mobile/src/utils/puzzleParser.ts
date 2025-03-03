export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  url: string;
}

export interface PuzzleCategory {
  name: string;
  puzzles: Puzzle[];
}

export interface PuzzleCollection {
  categories: PuzzleCategory[];
}

/**
 * Parses a text format of puzzles into a PuzzleCollection
 * Format:
 * # Category Name
 * https://lichess.org/training/12345
 * https://lichess.org/training/67890
 * 
 * # Another Category
 * https://lichess.org/training/abcde
 */
export function parseTextFormat(text: string): PuzzleCollection {
  const lines = text.split('\n');
  const collection: PuzzleCollection = { categories: [] };
  
  let currentCategory: PuzzleCategory | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('#')) {
      // This is a category name
      const categoryName = trimmedLine.substring(1).trim();
      currentCategory = { name: categoryName, puzzles: [] };
      collection.categories.push(currentCategory);
    } else if (trimmedLine.startsWith('https://lichess.org/training/') && currentCategory) {
      // This is a puzzle URL
      const puzzleId = extractPuzzleId(trimmedLine);
      if (puzzleId) {
        currentCategory.puzzles.push({
          id: puzzleId,
          fen: '', // Will be filled later
          moves: [], // Will be filled later
          rating: 0, // Will be filled later
          themes: [], // Will be filled later
          url: trimmedLine
        });
      }
    }
  }
  
  return collection;
}

/**
 * Extracts the puzzle ID from a Lichess puzzle URL
 * @param url The Lichess puzzle URL
 * @returns The puzzle ID or null if the URL is invalid
 */
export function extractPuzzleId(url: string): string | null {
  const match = url.match(/lichess\.org\/training\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
} 