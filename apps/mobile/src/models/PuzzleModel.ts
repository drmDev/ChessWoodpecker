import { Chess } from 'chess.js';
import { extractMoveComponents } from '../utils/chess/PuzzleLogic';

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
  pgn: string;                      // Original PGN from Lichess
  fen: string;                      // FEN representation of the puzzle position
  
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
    const promotion = uciMove.length === 5 ? uciMove[4] : undefined;
    
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
    if (promotion && !['q', 'r', 'b', 'n'].includes(promotion.toLowerCase())) {
        return false;
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

        const from = uciMove.substring(0, 2);
        const to = uciMove.substring(2, 4);
        const promotion = uciMove.length === 5 ? uciMove[4].toLowerCase() : undefined;

        // Create a clone to avoid modifying the original position
        const tempChess = new Chess(chess.fen());
        
        const move = tempChess.move({ from, to, promotion });
        return move ? move.san : null;
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
 * Process raw puzzle data from Lichess API into our internal format
 * @param data The raw puzzle data from Lichess API
 * @returns Processed puzzle data or null if invalid
 */
export function processPuzzleData(data: LichessPuzzleResponse): Puzzle | null {
    try {
        // Validate required fields
        if (!data?.game || !data?.puzzle?.solution || !Array.isArray(data.puzzle.solution)) {
            return null;
        }

        // Get the puzzle position
        const position = getPuzzlePosition(data.game.pgn || '', data.puzzle.initialPly);
        if (!position) {
            return null;
        }

        // Convert UCI moves to SAN
        const solutionMovesSAN: string[] = [];
        const solutionChess = new Chess(position.fen);

        for (const uciMove of data.puzzle.solution) {
            const san = convertUciToSan(solutionChess, uciMove);
            if (!san) {
                console.warn(`Invalid move in solution: ${uciMove}`);
                return null; // If any move is invalid, the whole puzzle is invalid
            }
            solutionMovesSAN.push(san);
            
            // Update position for next move
            const from = uciMove.substring(0, 2);
            const to = uciMove.substring(2, 4);
            const promotion = uciMove.length === 5 ? uciMove[4] : undefined;
            solutionChess.move({ from, to, promotion });
        }

        return {
            id: data.puzzle.id,
            pgn: data.game.pgn || '',
            fen: position.fen,
            initialPly: data.puzzle.initialPly,
            isWhiteToMove: position.isWhiteToMove,
            solutionMovesUCI: data.puzzle.solution,
            solutionMovesSAN: solutionMovesSAN,
            attempts: 0  // Initialize attempts to 0 for new puzzles
        };
    } catch (error) {
        console.error('Error in processPuzzleData:', error);
        return null;
    }
}