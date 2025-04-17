import { Chess } from 'chess.js';
import { 
  isValidUciMove,
  convertUciToSan, 
  isValidPgn,
  getPuzzlePosition,
  processPuzzleData,
  BackendPuzzleResponse
} from '../PuzzleModel';
import {
  FEN_STARTING_POSITION,
  FEN_AFTER_NF3,
  FEN_QUEEN_PROMOTION_CHECK,
  FEN_KNIGHT_PROMOTION_CHECK,
  FEN_PROMOTION_NO_CHECK
} from '../../utils/testing/chess-test-utils';

describe('PuzzleModel', () => {
  describe('isValidUciMove', () => {
    it('should validate correct UCI moves', () => {
      expect(isValidUciMove('e2e4')).toBe(true);
      expect(isValidUciMove('e7e8q')).toBe(true);
      expect(isValidUciMove('g1f3')).toBe(true);
    });

    it('should reject invalid UCI moves', () => {
      expect(isValidUciMove('')).toBe(false);
      expect(isValidUciMove('invalid')).toBe(false);
      expect(isValidUciMove('e2e')).toBe(false);
      expect(isValidUciMove('e2e4q2')).toBe(false);
      expect(isValidUciMove('x2e4')).toBe(false);
      expect(isValidUciMove('e2x4')).toBe(false);
      expect(isValidUciMove('e2e4x')).toBe(false);
    });
  });

  describe('convertUciToSan', () => {
    let chess: Chess;

    beforeEach(() => {
      chess = new Chess(FEN_STARTING_POSITION);
    });

    it('should convert valid UCI moves to SAN', () => {
      expect(convertUciToSan(chess, 'e2e4')).toBe('e4');
      chess.move('e4');
      expect(convertUciToSan(chess, 'e7e5')).toBe('e5');
    });

    it('should handle queen promotion with check', () => {
      const promotionPosition = new Chess(FEN_QUEEN_PROMOTION_CHECK);
      expect(convertUciToSan(promotionPosition, 'b7b8q')).toBe('b8=Q+');
    });

    it('should handle knight promotion with check', () => {
      const promotionPosition = new Chess(FEN_KNIGHT_PROMOTION_CHECK);
      expect(convertUciToSan(promotionPosition, 'd7d8n')).toBe('d8=N+');
    });

    it('should handle promotions without check', () => {
      const promotionPosition = new Chess(FEN_PROMOTION_NO_CHECK);
      expect(convertUciToSan(promotionPosition, 'd7d8q')).toBe('d8=Q');
      expect(convertUciToSan(promotionPosition, 'd7d8n')).toBe('d8=N');
    });

    it('should return null for invalid moves', () => {
      expect(convertUciToSan(chess, 'e2e5')).toBe(null); // Invalid pawn move
      expect(convertUciToSan(chess, 'e2e2')).toBe(null); // Same square
      expect(convertUciToSan(chess, 'a1a8')).toBe(null); // Through pieces
    });
  });

  describe('isValidPgn', () => {
    it('should validate PGN strings', () => {
      expect(isValidPgn('1. e4 e5 2. Nf3')).toBe(true);
      expect(isValidPgn('')).toBe(true); // Empty PGN is valid (starting position)
      expect(isValidPgn('invalid pgn')).toBe(false);
    });
  });

  describe('getPuzzlePosition', () => {
    it('should return correct position from PGN', () => {
      const pgn = '1. e4 e5 2. Nf3';
      const position = getPuzzlePosition(pgn, 3);
      
      expect(position).not.toBeNull();
      if (position) {
        expect(position.fen).toContain(FEN_AFTER_NF3.split(' ')[0]);
        expect(position.isWhiteToMove).toBe(false);
      }
    });

    it('should handle invalid inputs', () => {
      expect(getPuzzlePosition('invalid pgn', 1)).toBeNull();
      expect(getPuzzlePosition('1. e4 e5', -1)).toBeNull();
    });
  });

  describe('processPuzzleData', () => {
    const validPuzzleData: BackendPuzzleResponse = {
      lichess_puzzle_id: 'test1',
      pgn: '',  // Empty PGN for starting position
      initial_ply: 0,
      solution: ['e2e4'],
      theme: 'opening'
    };

    it('should process valid puzzle data', () => {
      const result = processPuzzleData(validPuzzleData);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('test1');
        expect(result.solutionMovesUCI).toEqual(['e2e4']);
        expect(result.solutionMovesSAN).toEqual(['e4']);
        expect(result.theme).toBe('opening');
      }
    });

    it('should return null for invalid puzzle data', () => {
      const invalidData = {
        lichess_puzzle_id: 'test2'
      };
      expect(processPuzzleData(invalidData as any)).toBeNull();
    });
  });
}); 