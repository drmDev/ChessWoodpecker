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
    
    // Compare the full move, including promotion piece if present
    if (userMoveUCI !== expectedMove) {
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
    console.error('Chess.js operation failed:', error);
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
  let uci = move.from + move.to;
  if (move.promotion) {
    uci += move.promotion;
  }
  return uci;
}

function isLegalMove(chess: Chess, userMove: { from: string; to: string; promotion?: string }): boolean {
  try {
    const moves = chess.moves({ verbose: true });
    const isLegal = moves.some(move => 
      move.from === userMove.from && 
      move.to === userMove.to && 
      (move.promotion === userMove.promotion || (!move.promotion && !userMove.promotion))
    );
    
    if (!isLegal) {
      // Move is illegal
      return false;
    }
    
    return true;
  } catch (_) {
    return false;
  }
}

export function validateMove(
  chess: Chess, 
  userMove: { from: string; to: string; promotion?: string },
  expectedMove: string
): boolean {
  // First check if the move is legal
  if (!isLegalMove(chess, userMove)) {
    return false;
  }
  
  // Convert user move to UCI format for comparison
  const userMoveUCI = `${userMove.from}${userMove.to}${userMove.promotion || ''}`;
  
  // Make the move to get the result
  chess.move({
    from: userMove.from,
    to: userMove.to,
    promotion: userMove.promotion
  });
  
  // Undo the move to restore the position
  chess.undo();
  
  // Compare with expected move
  const movesMatch = userMoveUCI === expectedMove;
  
  return movesMatch;
} 