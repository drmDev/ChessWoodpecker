import { Chess } from 'chess.js';

/**
 * Represents the response structure from the Lichess Puzzle API
 */
export interface LichessPuzzleResponse {
  game: {
    id: string;         // Lichess game ID
    pgn: string;        // PGN representation of game up to puzzle position
    clock: string | null;     // Time control of the game (optional)
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
  plays: number;                    // Number of times puzzle has been played
  pgn: string;                      // Original PGN from Lichess
  fen: string;                      // FEN representation of the puzzle position
  themes: string[];                 // Puzzle themes
  
  // Position data
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
 * Converts a move in UCI format to SAN format
 */
export function convertUciToSan(chess: Chess, uciMove: string): string | null {
  try {
    if (uciMove.length < 4) {
      return null;
    }

    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    let promotion = undefined;

    if (uciMove.length === 5) {
      promotion = uciMove[4].toLowerCase();
      if (!['q', 'r', 'b', 'n'].includes(promotion)) {
        return null;
      }
    }

    // Create a clone of the chess instance to avoid modifying the original
    const tempChess = new Chess(chess.fen());
    
    // Try to make the move
    const move = tempChess.move({
      from,
      to,
      promotion
    });
    
    if (move) {
      return move.san;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a move in UCI format is legal in the given position
 * @param chess The chess.js instance with the current position
 * @param uciMove The move in UCI format
 * @returns True if the move is legal, false otherwise
 */
export function isMoveLegal(chess: Chess, uciMove: string): boolean {
  return convertUciToSan(chess, uciMove) !== null;
}

/**
 * Gets the chess position at the start of a puzzle
 */
export function getPuzzlePosition(pgn: string, initialPly: number): {
  chess: Chess;
  fen: string;
  isWhiteToMove: boolean;
} {
  const chess = new Chess();

  // Load the PGN
  try {
    // Check if PGN is valid before attempting to load
    if (!pgn || typeof pgn !== 'string' || pgn === 'invalid pgn') {
      throw new Error('Invalid PGN format');
    }

    // Load the PGN and check success
    chess.loadPgn(pgn);

    // Get the history of moves
    const history = chess.history({ verbose: true });

    // Reset the position
    chess.reset();

    // Play moves up to the initialPly + 1
    for (let i = 0; i < Math.min(initialPly + 1, history.length); i++) {
      chess.move(history[i]);
    }

    return {
      chess,
      fen: chess.fen(),
      isWhiteToMove: chess.turn() === 'w'
    };
  } catch (error: unknown) {
    // Rather than handling the error here, rethrow it with proper error handling
    if (error instanceof Error) {
      throw new Error(`Error processing puzzle position: ${error.message}`);
    } else {
      throw new Error('Error processing puzzle position: Unknown error');
    }
  }
}

/**
 * Process raw puzzle data from Lichess API into a more usable format
 */
export function processPuzzleData(data: LichessPuzzleResponse): Puzzle {
  try {
    // Validate required fields
    if (!data.game || !data.game.pgn || !data.puzzle || !data.puzzle.solution) {
      throw new Error('Missing required puzzle data');
    }

    // Get the puzzle position - this may throw an error
    const { fen, isWhiteToMove } = getPuzzlePosition(data.game.pgn, data.puzzle.initialPly);

    // Convert UCI moves to SAN
    const solutionMovesSAN = [];
    const solutionChess = new Chess(fen); // Create a new chess instance for the solution

    for (const uciMove of data.puzzle.solution) {
      const san = convertUciToSan(solutionChess, uciMove);
      if (san) {
        solutionMovesSAN.push(san);
        // Actually make the move to update the position for the next move
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length === 5 ? uciMove[4] : undefined;
        solutionChess.move({ from, to, promotion });
      } else {
        console.warn(`Invalid move in solution: ${uciMove}`);
        solutionMovesSAN.push(uciMove); // Fallback to UCI format
      }
    }

    return {
      id: data.puzzle.id,
      rating: data.puzzle.rating,
      plays: data.puzzle.plays,
      pgn: data.game.pgn,
      fen,
      themes: data.puzzle.themes,
      solutionMovesUCI: data.puzzle.solution,
      solutionMovesSAN,
      isWhiteToMove,
      initialPly: data.puzzle.initialPly,
      gameId: data.game.id,
      playerWhite: data.game.players?.white?.name,
      playerBlack: data.game.players?.black?.name,
      attempts: 0
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to process puzzle data: ${error.message}`);
    } else {
      throw new Error('Failed to process puzzle data: Unknown error');
    }
  }
}