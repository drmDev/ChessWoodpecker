/**
 * Represents the response structure from the Lichess Puzzle API
 */
export interface LichessPuzzleResponse {
  game: {
    id: string;         // Lichess game ID
    pgn: string;        // PGN representation of game up to puzzle position
    clock?: string;     // Time control of the game (optional)
    perf?: {            // Performance category
      icon: string;
      name: string;
    };
    players?: {         // Player information (optional)
      white: { name: string; rating: number };
      black: { name: string; rating: number };
    };
  };
  puzzle: {
    id: string;         // Puzzle ID
    rating: number;     // Puzzle difficulty rating
    plays: number;      // Number of times puzzle has been played
    solution: string[]; // Solution moves in UCI format (e.g., "e2e4")
    initialPly: number; // Number of half-moves before puzzle position
    themes: string[];   // Puzzle themes/tags
  };
}

/**
 * Represents our internal puzzle model with pre-calculated properties
 */
export interface Puzzle {
  // Core identification
  id: string;                       // Puzzle ID from Lichess
  rating: number;                   // Difficulty rating
  themes: string[];                 // Puzzle themes
  
  // Position data
  fen: string;                      // FEN representation of the puzzle position
  pgn: string;                      // Original PGN from Lichess
  initialPly: number;               // Ply count from the original game
  isWhiteToMove: boolean;           // Whether it's white's turn in the puzzle
  
  // Solution data
  solutionMovesUCI: string[];       // Solutions in UCI format (original from API)
  solutionMovesSAN: string[];       // Solutions converted to SAN format (e.g., "e4")
  
  // Game context
  gameId?: string;                  // Original game ID (if available)
  playerWhite?: string;             // White player name (if available)
  playerBlack?: string;             // Black player name (if available)
  
  // User progress tracking
  attempts: number;                 // Number of times user has attempted
  lastAttemptedAt?: number;         // Timestamp of last attempt
  succeeded?: boolean;              // Whether user solved successfully
  successRate?: number;             // Success percentage (if multiple attempts)
  
  // Spaced repetition data
  nextRepetitionDate?: number;      // When to show this puzzle again
  repetitionLevel?: number;         // Spaced repetition level (0-5)
}

/**
 * Represents user progress data for a puzzle
 */
export interface PuzzleProgress {
  puzzleId: string;                 // Reference to the puzzle
  attempts: number;                 // Number of attempts
  lastAttemptedAt: number;          // Timestamp of last attempt
  succeeded: boolean;               // Whether the puzzle was solved successfully
  nextRepetitionDate?: number;      // When to show this puzzle again
  repetitionLevel?: number;         // Current spaced repetition level
}

/**
 * Represents a collection of puzzles
 */
export interface PuzzleCollection {
  id: string;                       // Collection ID
  name: string;                     // Collection name
  description?: string;             // Collection description
  puzzleIds: string[];              // IDs of puzzles in this collection
  createdAt: number;                // Creation timestamp
  updatedAt: number;                // Last update timestamp
}

/**
 * Placeholder for the puzzle data processing function
 * This will be implemented in a later step
 */
export function processPuzzleData(response: LichessPuzzleResponse): Puzzle {
  // This is just a placeholder to make the tests pass
  // We'll implement this function in the next step
  return {} as Puzzle;
} 