import { Chess } from 'chess.js';

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
 * Converts a move in UCI format to SAN format
 * @param chess The chess.js instance with the current position
 * @param uciMove The move in UCI format (e.g., "e2e4" or "e7e8q")
 * @returns The move in SAN format, or null if the move is invalid
 * 
 * Note: This function uses the 'sloppy' option when making moves, which is critical for handling
 * UCI moves correctly. The 'sloppy' option allows chess.js to be more lenient in move validation,
 * accepting moves that might not strictly adhere to chess.js's internal move format but are valid
 * chess moves. This is especially important for handling moves from external sources like Lichess.
 */
export function convertUciToSan(chess: Chess, uciMove: string): string | null {
  try {
    // Parse the UCI move format (e.g., "e2e4" or "e7e8q")
    if (uciMove.length < 4) {
      console.warn(`Invalid UCI move format: ${uciMove}`);
      return null;
    }
    
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    let promotion = undefined;
    
    // Check for promotion piece
    if (uciMove.length > 4) {
      promotion = uciMove.substring(4, 5).toLowerCase();
      // Validate promotion piece
      if (!['q', 'r', 'b', 'n'].includes(promotion)) {
        console.warn(`Invalid promotion piece: ${promotion}`);
        promotion = undefined;
      }
    }
    
    // Create a move object
    const moveObj: {
      from: string;
      to: string;
      promotion?: string;
    } = {
      from,
      to
    };
    
    // Add promotion if specified
    if (promotion) {
      moveObj.promotion = promotion;
    }
    
    // Try to make the move
    // The 'sloppy' option is crucial here as it allows more flexible move parsing,
    // which is necessary for handling UCI moves from external sources like Lichess.
    // Without this option, many valid moves might be rejected by chess.js.
    const move = chess.move(moveObj, { sloppy: true } as any);
    
    if (move) {
      // Undo the move to keep the position unchanged
      chess.undo();
      return move.san;
    } else {
      console.warn(`Move not legal in position: ${uciMove}`);
      return null;
    }
  } catch (error) {
    // Invalid move
    console.error('Error converting UCI to SAN:', error);
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
 * @param pgn The PGN representation of the game
 * @param initialPly The number of half-moves before the puzzle position
 * @returns An object containing the chess instance, FEN string, and whose turn it is
 * 
 * Note: This function plays moves up to initialPly + 1 because:
 * 1. The initialPly value from Lichess represents the number of half-moves played BEFORE the puzzle position
 * 2. In Lichess puzzles, the player (user) always makes the first move of the puzzle
 * 3. By playing initialPly + 1 moves, we reach the position where the opponent has just made their move
 *    and it's now the player's turn to make the first move of the puzzle
 * This approach ensures we're at the correct position where the puzzle starts, with the correct player to move.
 */
export function getPuzzlePosition(pgn: string, initialPly: number): { 
  chess: Chess; 
  fen: string; 
  isWhiteToMove: boolean;
} {
  const chess = new Chess();
  
  // Load the PGN
  try {
    chess.loadPgn(pgn);
    
    // Get the history of moves
    const history = chess.history({ verbose: true });
    
    // Reset the position
    chess.reset();
    
    // Play moves up to the initialPly + 1
    // This ensures we're at the position where the opponent has just moved
    // and it's the player's turn to make the first move of the puzzle
    for (let i = 0; i < Math.min(initialPly + 1, history.length); i++) {
      chess.move(history[i]);
    }
    
    return {
      chess,
      fen: chess.fen(),
      isWhiteToMove: chess.turn() === 'w'
    };
  } catch (error) {
    // If there's an error loading the PGN, return a new chess instance
    console.error('Error loading PGN:', error);
    return {
      chess: new Chess(),
      fen: new Chess().fen(),
      isWhiteToMove: true
    };
  }
}

/**
 * Transforms a Lichess API response into our internal Puzzle model
 * @param response The Lichess API response
 * @returns A Puzzle object with pre-calculated properties
 */
export function processPuzzleData(response: LichessPuzzleResponse): Puzzle {
  try {
    // Get the puzzle position
    const { chess, fen, isWhiteToMove } = getPuzzlePosition(
      response.game.pgn,
      response.puzzle.initialPly
    );
    
    // Convert UCI solution moves to SAN
    const solutionMovesSAN: string[] = [];
    const tempChess = new Chess(fen);
    
    for (const uciMove of response.puzzle.solution) {
      try {
        if (uciMove.length < 4) {
          console.warn(`Skipping invalid UCI move: ${uciMove}`);
          continue;
        }
        
        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        let promotion = undefined;
        
        // Check for promotion piece
        if (uciMove.length > 4) {
          promotion = uciMove.substring(4, 5).toLowerCase();
          // Validate promotion piece
          if (!['q', 'r', 'b', 'n'].includes(promotion)) {
            console.warn(`Invalid promotion piece: ${promotion}`);
            promotion = undefined;
          }
        }
        
        // Create a move object
        const moveObj: {
          from: string;
          to: string;
          promotion?: string;
        } = {
          from,
          to
        };
        
        // Add promotion if specified
        if (promotion) {
          moveObj.promotion = promotion;
        }
        
        // Try to make the move
        const move = tempChess.move(moveObj);
        
        if (move) {
          solutionMovesSAN.push(move.san);
        } else {
          console.warn(`Skipping illegal move in solution: ${uciMove}`);
        }
      } catch (error) {
        console.error('Error processing solution move:', error);
        // Continue with the next move instead of breaking
      }
    }
    
    // Create the puzzle object with default values for user progress
    return {
      // Core identification
      id: response.puzzle.id,
      rating: response.puzzle.rating,
      themes: response.puzzle.themes || [],
      
      // Position data
      fen,
      pgn: response.game.pgn,
      initialPly: response.puzzle.initialPly,
      isWhiteToMove,
      
      // Solution data
      solutionMovesUCI: response.puzzle.solution,
      solutionMovesSAN,
      
      // Game context
      gameId: response.game.id,
      playerWhite: response.game.players?.white?.name,
      playerBlack: response.game.players?.black?.name,
      
      // User progress tracking (default values)
      attempts: 0
      // succeeded is now optional again
    };
  } catch (error) {
    console.error('Error processing puzzle data:', error);
    throw error;
  }
} 