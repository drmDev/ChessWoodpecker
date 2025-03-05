import { Chess } from 'chess.js';

export interface UserMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface PuzzleValidationResult {
  isValid: boolean;
  isComplete: boolean;
  nextMove: string | null;  // UCI format move for the opponent
}

/**
 * Validates a user's move against the puzzle solution
 * @param position Current chess position
 * @param userMove The move the user is attempting
 * @param solutionMoves Array of solution moves in UCI format
 * @param currentMoveIndex Index in the solution sequence
 * @returns Validation result with next move if valid
 */
export function validatePuzzleMove(
  position: Chess,
  userMove: UserMove,
  solutionMoves: string[],
  currentMoveIndex: number
): PuzzleValidationResult {
  // First check if the move is legal in the current position
  try {
    // Clone the position to avoid modifying the original
    const testPosition = new Chess(position.fen());
    const moveResult = testPosition.move({
      from: userMove.from,
      to: userMove.to,
      promotion: userMove.promotion
    });

    // If move is illegal in this position
    if (!moveResult) {
      console.log('Move is illegal:', userMove);
      return {
        isValid: false,
        isComplete: false,
        nextMove: null
      };
    }

    // Convert user move to UCI format for comparison
    const userMoveUCI = moveToUCI(userMove);
    
    // Get the expected move at this position
    const expectedMove = solutionMoves[currentMoveIndex];
    
    console.log('Comparing moves:', {
      userMoveUCI,
      expectedMove,
      userMove,
      moveResult
    });
    
    // If moves don't match, move is invalid
    if (userMoveUCI !== expectedMove) {
      console.log('Moves do not match');
      return {
        isValid: false,
        isComplete: false,
        nextMove: null
      };
    }
    
    // Move is valid, check if it's the last move in the sequence
    const isLastMove = currentMoveIndex === solutionMoves.length - 1;
    
    return {
      isValid: true,
      isComplete: isLastMove,
      nextMove: isLastMove ? null : solutionMoves[currentMoveIndex + 1]
    };
  } catch (error) {
    // If any chess.js operations fail, consider the move invalid
    console.error('Error validating move:', error);
    return {
      isValid: false,
      isComplete: false,
      nextMove: null
    };
  }
}

/**
 * Converts a move object to UCI format
 * @param move Move object with from, to, and optional promotion
 * @returns UCI format string (e.g., "e2e4" or "e7e8q")
 */
export function moveToUCI(move: UserMove): string {
  const { from, to, promotion } = move;
  return from + to + (promotion ? promotion.toLowerCase() : '');
}

/**
 * Test-only function to help debug validation issues
 */
export function debugValidateMove(
  position: Chess,
  userMove: UserMove,
  solutionMoves: string[],
  currentMoveIndex: number
): string {
  try {
    const testPosition = new Chess(position.fen());
    const moveResult = testPosition.move({
      from: userMove.from,
      to: userMove.to,
      promotion: userMove.promotion
    });

    const userMoveUCI = moveToUCI(userMove);
    const expectedMove = solutionMoves[currentMoveIndex];

    return `
      Debug info:
      - Move result: ${moveResult ? 'legal' : 'illegal'}
      - User move UCI: ${userMoveUCI}
      - Expected move: ${expectedMove}
      - Position FEN: ${position.fen()}
      - Move details: ${JSON.stringify(userMove)}
      ${moveResult ? `- Resulting position: ${testPosition.fen()}` : ''}
    `;
  } catch (error) {
    return `Error during validation: ${error}`;
  }
} 