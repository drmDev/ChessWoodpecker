import { Chess } from 'chess.js';
import { extractMoveComponents } from '../utils/chess/PuzzleLogic';

/**
 * Represents the response structure from the Lichess Puzzle API
 * NOTE: This is only kept for reference. We no longer directly use the Lichess API.
 * We now use our own backend which returns BackendPuzzleResponse.
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
 * Represents the response structure from our backend API
 */
export interface BackendPuzzleResponse {
  lichess_puzzle_id: string;  // Puzzle ID from Lichess
  pgn: string;                // PGN representation of game up to puzzle position
  initial_ply: number;        // Number of half-moves before puzzle position
  solution: string[];         // Solution moves in UCI format
  theme: string;              // Single theme of the puzzle (from our database)
}

/**
 * Represents our internal puzzle model with pre-calculated properties
 */
export interface Puzzle {
  // Core identification
  id: string;                       // Puzzle ID from Lichess
  pgn: string;                      // Original PGN from Lichess
  fen: string;                      // FEN representation of the puzzle position
  theme: string;                    // Theme of the puzzle
  
  // Position data
  initialPly: number;               // Ply count from the original game
  isWhiteToMove: boolean;           // Whether it's white's turn in the puzzle
  
  // Solution data
  solutionMovesUCI: string[];       // Solutions in UCI format (original from API)
  solutionMovesSAN: string[];       // Solutions converted to SAN format (e.g., "e4")
  
  // User progress tracking
  attempts: number;                 // Number of times user has attempted
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
 * Validates a UCI format move string
 * @param uciMove The move in UCI format (e.g., "e2e4" or "e7e8q")
 * @returns True if the move string is valid UCI format
 */
export function isValidUciMove(uciMove: string): boolean {
    if (!uciMove || typeof uciMove !== 'string') return false;

    // Basic UCI move is 4 characters (e.g., "e2e4")
    if (uciMove.length !== 4 && uciMove.length !== 5) return false;

    // Check if the squares are valid
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);

    const isValidSquare = (square: string) => {
        const file = square[0];
        const rank = square[1];
        return (
            file >= 'a' && file <= 'h' &&
            rank >= '1' && rank <= '8'
        );
    };

    if (!isValidSquare(from) || !isValidSquare(to)) return false;

    // If promotion piece is specified, it must be valid
    if (uciMove.length === 5) {
        const piece = uciMove[4].toLowerCase();
        if (!['q', 'r', 'b', 'n'].includes(piece)) {
            return false;
        }
    }

    return true;
}

/**
 * Converts a move in UCI format to SAN format
 * @param chess The chess.js instance with the current position
 * @param uciMove The move in UCI format
 * @returns The move in SAN format or null if invalid
 */
export function convertUciToSan(chess: Chess, uciMove: string): string | null {
    try {
        if (!chess || !isValidUciMove(uciMove)) {
            return null;
        }

        try {
            const { from, to, promotion } = extractMoveComponents(uciMove);

            // Create a clone to avoid modifying the original position
            const tempChess = new Chess(chess.fen());

            const move = tempChess.move({ from, to, promotion });
            return move ? move.san : null;
        } catch (error) {
            console.error('Error extracting move components:', error);
            return null;
        }
    } catch (error) {
        console.error('Error in convertUciToSan:', error);
        return null;
    }
}

/**
 * Validates a PGN string
 * @param pgn The PGN string to validate
 * @returns True if the PGN is valid
 */
export function isValidPgn(pgn: string): boolean {
    if (typeof pgn !== 'string') return false;
    if (pgn === '') return true; // Empty PGN is valid (starting position)
    
    try {
        const chess = new Chess();
        chess.loadPgn(pgn);
        return true;
    } catch {
        return false;
    }
}

/**
 * Gets the chess position at the start of a puzzle
 * @param pgn The PGN string of the game
 * @param initialPly The ply number where the puzzle starts
 * @returns Object containing the position details or null if invalid
 */
export function getPuzzlePosition(pgn: string, initialPly: number): {
    chess: Chess;
    fen: string;
    isWhiteToMove: boolean;
} | null {
    if (typeof initialPly !== 'number' || initialPly < 0) {
        return null;
    }

    try {
        const chess = new Chess();
        
        // Handle empty PGN as starting position
        if (pgn === '') {
            return {
                chess,
                fen: chess.fen(),
                isWhiteToMove: chess.turn() === 'w'
            };
        }

        // Load and validate PGN
        try {
            chess.loadPgn(pgn);
        } catch {
            return null;
        }

        const history = chess.history({ verbose: true });
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
    } catch (error) {
        console.error('Error in getPuzzlePosition:', error);
        return null;
    }
}

/**
 * Process raw puzzle data from our backend into our internal format
 * @param data The raw puzzle data from our backend API
 * @returns Processed puzzle data or null if invalid
 */
export function processPuzzleData(data: BackendPuzzleResponse): Puzzle | null {
    try {
        // Validate required fields
        if (!data?.lichess_puzzle_id || data.solution === undefined || !Array.isArray(data.solution)) {
            return null;
        }

        // Handle empty PGN as a special case
        const pgn = data.pgn || '';
        const initialPly = data.initial_ply || 0;
        
        // Get the puzzle position - special handling for empty PGN
        let position;
        if (pgn === '' && initialPly === 0) {
            // For empty PGN and initialPly 0, use starting position
            const chess = new Chess();
            position = {
                chess,
                fen: chess.fen(),
                isWhiteToMove: true
            };
        } else {
            position = getPuzzlePosition(pgn, initialPly);
        }
        
        if (!position) {
            return null;
        }

        // Convert UCI moves to SAN
        const solutionMovesSAN: string[] = [];
        const solutionChess = new Chess(position.fen);

        for (const uciMove of data.solution) {
            const san = convertUciToSan(solutionChess, uciMove);
            if (!san) {
                console.error('Invalid move in solution:', uciMove);
                return null; // If any move is invalid, the whole puzzle is invalid
            }
            solutionMovesSAN.push(san);

            // Update position for next move using extractMoveComponents
            try {
                const { from, to, promotion } = extractMoveComponents(uciMove);
                solutionChess.move({ from, to, promotion });
            } catch (error) {
                console.error('Error extracting move components:', error);
                return null;
            }
        }

        return {
            id: data.lichess_puzzle_id,
            pgn: pgn,
            fen: position.fen,
            theme: data.theme || 'Uncategorized',
            initialPly: initialPly,
            isWhiteToMove: position.isWhiteToMove,
            solutionMovesUCI: data.solution,
            solutionMovesSAN: solutionMovesSAN,
            attempts: 0  // Initialize attempts to 0 for new puzzles
        };
    } catch (error) {
        console.error('Error in processPuzzleData:', error);
        return null;
    }
}