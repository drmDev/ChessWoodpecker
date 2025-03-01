import { Chess, Move, Square } from 'chess.js';
import { PuzzleData } from '../services/PuzzleService';

export interface PuzzlePlayerOptions {
  onCorrectMove?: () => void;
  onIncorrectMove?: () => void;
  onPuzzleComplete?: () => void;
  onAIMove?: (move: Move) => void;
}

/**
 * Class for handling puzzle gameplay
 */
export class PuzzlePlayer {
  private chess: Chess;
  private currentPuzzle: PuzzleData | null = null;
  private currentSolutionIndex = 0;
  private isUserTurn = true;
  private options: PuzzlePlayerOptions;
  
  constructor(options: PuzzlePlayerOptions = {}) {
    this.chess = new Chess();
    this.options = options;
  }
  
  /**
   * Load a puzzle and set up the initial position
   */
  public loadPuzzle(puzzleData: PuzzleData): void {
    this.currentPuzzle = puzzleData;
    this.currentSolutionIndex = 0;
    
    // Reset chess instance
    this.chess = new Chess();
    
    // Load the PGN to set up the position
    this.chess.loadPgn(puzzleData.pgn);
    
    // Move to the initial position (the position where the puzzle starts)
    // We need to navigate to the correct ply (half-move)
    const history = this.chess.history({ verbose: true });
    this.chess.reset();
    
    for (let i = 0; i < puzzleData.initialPly; i++) {
      if (i < history.length) {
        this.chess.move({
          from: history[i].from,
          to: history[i].to,
          promotion: history[i].promotion
        });
      }
    }
    
    // Determine if user plays first (always true for puzzles)
    this.isUserTurn = true;
  }
  
  /**
   * Get the current board position as FEN
   */
  public getFen(): string {
    return this.chess.fen();
  }
  
  /**
   * Get whose turn it is (white or black)
   */
  public getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }
  
  /**
   * Check if it's the user's turn to move
   */
  public isUsersTurn(): boolean {
    return this.isUserTurn;
  }
  
  /**
   * Try to make a move and check if it matches the solution
   */
  public tryMove(from: Square, to: Square, promotion?: string): boolean {
    if (!this.isUserTurn || !this.currentPuzzle) {
      return false;
    }
    
    // Convert move to UCI format for comparison with solution
    const uciMove = `${from}${to}${promotion || ''}`;
    const expectedMove = this.currentPuzzle.solution[this.currentSolutionIndex];
    
    // Check if move matches solution
    if (uciMove === expectedMove) {
      // Make the move
      const move = this.chess.move({
        from,
        to,
        promotion: promotion as any
      });
      
      if (!move) return false;
      
      this.currentSolutionIndex++;
      
      // Notify about correct move
      if (this.options.onCorrectMove) {
        this.options.onCorrectMove();
      }
      
      // If there's another move in the solution, it's the AI's turn
      if (this.currentSolutionIndex < this.currentPuzzle.solution.length) {
        this.isUserTurn = false;
        
        // Make AI move after a short delay
        setTimeout(() => {
          this.makeAIMove();
        }, 500);
      } else {
        // Puzzle completed
        if (this.options.onPuzzleComplete) {
          this.options.onPuzzleComplete();
        }
      }
      
      return true;
    } else {
      // Incorrect move
      if (this.options.onIncorrectMove) {
        this.options.onIncorrectMove();
      }
      
      return false;
    }
  }
  
  /**
   * Make the AI's move from the solution
   */
  private makeAIMove(): void {
    if (!this.currentPuzzle) return;
    
    // Get AI move from solution
    const aiMoveUci = this.currentPuzzle.solution[this.currentSolutionIndex];
    
    // Parse UCI move
    const from = aiMoveUci.substring(0, 2) as Square;
    const to = aiMoveUci.substring(2, 4) as Square;
    const promotion = aiMoveUci.length === 5 ? aiMoveUci[4] : undefined;
    
    // Make the move
    const move = this.chess.move({
      from,
      to,
      promotion: promotion as any
    });
    
    if (move && this.options.onAIMove) {
      this.options.onAIMove(move);
    }
    
    this.currentSolutionIndex++;
    this.isUserTurn = true;
  }
  
  /**
   * Convert UCI format move to SAN (Standard Algebraic Notation)
   */
  public uciToSan(uciMove: string): string | null {
    if (uciMove.length < 4) return null;
    
    const from = uciMove.substring(0, 2) as Square;
    const to = uciMove.substring(2, 4) as Square;
    const promotion = uciMove.length === 5 ? uciMove[4] : undefined;
    
    try {
      // Create a temporary chess instance with the current position
      const tempChess = new Chess(this.chess.fen());
      
      // Make the move
      const move = tempChess.move({
        from,
        to,
        promotion: promotion as any
      });
      
      return move ? move.san : null;
    } catch (error) {
      console.error('Error converting UCI to SAN:', error);
      return null;
    }
  }
  
  /**
   * Get legal moves for a square
   */
  public getLegalMoves(square: Square): Square[] {
    const moves = this.chess.moves({
      square,
      verbose: true
    });
    
    return moves.map(move => move.to);
  }
  
  /**
   * Get the current puzzle
   */
  public getCurrentPuzzle(): PuzzleData | null {
    return this.currentPuzzle;
  }
  
  /**
   * Reset the current puzzle to the starting position
   */
  public resetPuzzle(): void {
    if (this.currentPuzzle) {
      this.loadPuzzle(this.currentPuzzle);
    }
  }
  
  /**
   * Check if the puzzle is completed
   */
  public isPuzzleCompleted(): boolean {
    if (!this.currentPuzzle) return false;
    
    return this.currentSolutionIndex >= this.currentPuzzle.solution.length;
  }
} 