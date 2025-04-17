import { Chess, Square } from 'chess.js';
import { SoundName } from '../sounds';

export interface MoveComponents {
  from: string;
  to: string;
  promotion?: string;
}

/**
 * Extracts move components from UCI notation
 */
export function extractMoveComponents(uciMove: string): MoveComponents {
  if (uciMove.length < 4) {
    throw new Error('Invalid UCI move: too short');
  }

  const from = uciMove.substring(0, 2);
  const to = uciMove.substring(2, 4);
  let promotion: string | undefined = undefined;

  if (uciMove.length === 5) {
    const piece = uciMove[4].toLowerCase();
    if (!['q', 'r', 'b', 'n'].includes(piece)) {
      throw new Error('Invalid promotion piece');
    }
    promotion = piece;
  }

  return { from, to, promotion };
}

/**
 * Determines if a move would result in pawn promotion
 */
export function isPromotionMove(chess: Chess, from: string, to: string): boolean {
  const piece = chess.get(from as Square);
  return !!(piece && piece.type === 'p' && 
    ((piece.color === 'w' && to[1] === '8') || 
     (piece.color === 'b' && to[1] === '1')));
}

/**
 * Replays a sequence of moves from a starting position
 * Returns false if any move is invalid
 */
export function replayMoves(chess: Chess, startingFen: string, moves: string[]): boolean {
  chess.load(startingFen);
  
  for (const move of moves) {
    const { from, to, promotion } = extractMoveComponents(move);
    const result = chess.move({ from, to, promotion });
    if (!result) return false;
  }
  
  return true;
}

/**
 * Determines the type of move made (capture, check, or normal)
 */
export function getMoveType(chess: Chess, moveResult: ReturnType<typeof Chess.prototype.move>): SoundName {
  if (moveResult.captured) return 'capture';
  if (chess.inCheck()) return 'check';
  return 'move';
} 