import { Chess, Move, Square } from 'chess.js';
import { Puzzle } from './puzzleParser';

export interface PuzzlePlayerOptions {
  onCorrectMove?: () => void;
  onIncorrectMove?: () => void;
  onPuzzleComplete?: () => void;
  onAiMove?: (move: string) => void;
}

export class PuzzlePlayer {
  private chess: Chess;
  private currentPuzzle: Puzzle | null = null;
  private currentSolutionIndex = 0;
  private isUserTurn = false;
  private options: PuzzlePlayerOptions;

  constructor(options: PuzzlePlayerOptions = {}) {
    this.chess = new Chess();
    this.options = options;
  }

  /**
   * Loads a puzzle and sets up the board
   * @param puzzle The puzzle to load
   */
  loadPuzzle(puzzle: Puzzle): void {
    this.currentPuzzle = puzzle;
    this.currentSolutionIndex = 0;
    
    // Set up the board with the puzzle's FEN
    this.chess.load(puzzle.fen);
    
    // Make the first move (AI move)
    if (puzzle.moves.length > 0) {
      const firstMove = puzzle.moves[0];
      this.chess.move(firstMove);
      this.currentSolutionIndex = 1;
      this.isUserTurn = true;
      
      if (this.options.onAiMove) {
        this.options.onAiMove(firstMove);
      }
    }
  }

  /**
   * Gets the current board position in FEN format
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Checks if it's the user's turn
   */
  isUsersTurn(): boolean {
    return this.isUserTurn;
  }

  /**
   * Tries a move and checks if it's correct
   * @param move The move in UCI format (e.g. "e2e4")
   * @returns true if the move is correct, false otherwise
   */
  tryMove(move: string): boolean {
    if (!this.currentPuzzle || !this.isUserTurn) {
      return false;
    }

    // Convert UCI to SAN if needed
    const sanMove = this.uciToSan(move);
    if (!sanMove) {
      if (this.options.onIncorrectMove) {
        this.options.onIncorrectMove();
      }
      return false;
    }

    // Check if the move is correct
    const expectedMove = this.currentPuzzle.moves[this.currentSolutionIndex];
    if (sanMove !== expectedMove) {
      if (this.options.onIncorrectMove) {
        this.options.onIncorrectMove();
      }
      return false;
    }

    // Make the move
    this.chess.move(sanMove);
    this.currentSolutionIndex++;
    this.isUserTurn = false;

    if (this.options.onCorrectMove) {
      this.options.onCorrectMove();
    }

    // Check if the puzzle is complete
    if (this.currentSolutionIndex >= this.currentPuzzle.moves.length) {
      if (this.options.onPuzzleComplete) {
        this.options.onPuzzleComplete();
      }
      return true;
    }

    // Make the AI move
    this.makeAiMove();
    return true;
  }

  /**
   * Makes the AI move
   */
  private makeAiMove(): void {
    if (!this.currentPuzzle) {
      return;
    }

    const aiMove = this.currentPuzzle.moves[this.currentSolutionIndex];
    this.chess.move(aiMove);
    this.currentSolutionIndex++;
    this.isUserTurn = true;

    if (this.options.onAiMove) {
      this.options.onAiMove(aiMove);
    }
  }

  /**
   * Converts a UCI move to SAN notation
   * @param uci The UCI move (e.g. "e2e4")
   * @returns The SAN move (e.g. "e4") or null if the move is invalid
   */
  private uciToSan(uci: string): string | null {
    if (uci.length < 4) {
      return null;
    }

    const from = uci.substring(0, 2) as Square;
    const to = uci.substring(2, 4) as Square;
    let promotion = undefined;

    if (uci.length > 4) {
      promotion = uci.substring(4, 5);
    }

    try {
      const move = this.chess.move({ from, to, promotion }) as Move;
      this.chess.undo(); // Undo the move to keep the board state
      return move.san;
    } catch (e) {
      return null;
    }
  }

  /**
   * Gets the legal moves for a square
   * @param square The square to get moves for
   * @returns An array of legal moves
   */
  getLegalMovesForSquare(square: Square): Square[] {
    const moves = this.chess.moves({ square, verbose: true }) as Move[];
    return moves.map(move => move.to);
  }

  /**
   * Resets the player
   */
  reset(): void {
    this.chess = new Chess();
    this.currentPuzzle = null;
    this.currentSolutionIndex = 0;
    this.isUserTurn = false;
  }
}