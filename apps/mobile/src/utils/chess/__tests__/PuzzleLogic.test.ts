import { Chess } from 'chess.js';
import { extractMoveComponents, isPromotionMove, replayMoves, getMoveType } from '../PuzzleLogic';

describe('PuzzleLogic', () => {
  describe('extractMoveComponents', () => {
    it('extracts basic move components', () => {
      const result = extractMoveComponents('e2e4');
      expect(result).toEqual({
        from: 'e2',
        to: 'e4',
        promotion: undefined
      });
    });

    it('extracts promotion move components', () => {
      const result = extractMoveComponents('e7e8q');
      expect(result).toEqual({
        from: 'e7',
        to: 'e8',
        promotion: 'q'
      });
    });

    it('validates promotion pieces', () => {
      // Valid promotion pieces
      expect(extractMoveComponents('e7e8q').promotion).toBe('q');
      expect(extractMoveComponents('e7e8r').promotion).toBe('r');
      expect(extractMoveComponents('e7e8b').promotion).toBe('b');
      expect(extractMoveComponents('e7e8n').promotion).toBe('n');

      // Invalid promotion pieces
      expect(() => extractMoveComponents('e7e8x')).toThrow('Invalid promotion piece');
      expect(() => extractMoveComponents('e7e8p')).toThrow('Invalid promotion piece');
    });

    it('validates move length', () => {
      expect(() => extractMoveComponents('e2')).toThrow('Invalid UCI move: too short');
      expect(() => extractMoveComponents('e2e')).toThrow('Invalid UCI move: too short');
    });
  });

  describe('isPromotionMove', () => {
    let chess: Chess;

    beforeEach(() => {
      chess = new Chess();
    });

    it('detects white pawn promotion', () => {
      chess.load('4k3/4P3/8/8/8/8/8/4K3 w - - 0 1'); // White pawn on e7
      expect(isPromotionMove(chess, 'e7', 'e8')).toBe(true);
    });

    it('detects black pawn promotion', () => {
      chess.load('4k3/8/8/8/8/8/4p3/4K3 b - - 0 1'); // Black pawn on e2
      expect(isPromotionMove(chess, 'e2', 'e1')).toBe(true);
    });

    it('returns false for non-promotion moves', () => {
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(isPromotionMove(chess, 'e2', 'e4')).toBe(false);
    });
  });

  describe('replayMoves', () => {
    let chess: Chess;

    beforeEach(() => {
      chess = new Chess();
    });

    it('replays valid move sequence', () => {
      const startPos = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const moves = ['e2e4', 'e7e5', 'g1f3'];
      expect(replayMoves(chess, startPos, moves)).toBe(true);
    });

    it('returns false for invalid move sequence', () => {
      const startPos = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const moves = ['e2e4', 'e7e5', 'h2h4']; // h2h4 is valid but not optimal
      expect(replayMoves(chess, startPos, moves)).toBe(true);
    });
  });

  describe('getMoveType', () => {
    let chess: Chess;

    beforeEach(() => {
      chess = new Chess();
    });

    it('identifies capture moves', () => {
      chess.load('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
      const moveResult = chess.move({ from: 'e4', to: 'd5' });
      expect(getMoveType(chess, moveResult!)).toBe('capture');
    });

    it('identifies check moves', () => {
      chess.load('4k3/8/8/8/8/8/8/4Q1K1 w - - 0 1');
      const moveResult = chess.move({ from: 'e1', to: 'e7' });
      expect(getMoveType(chess, moveResult!)).toBe('check');
    });

    it('identifies normal moves', () => {
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      const moveResult = chess.move({ from: 'e2', to: 'e4' });
      expect(getMoveType(chess, moveResult!)).toBe('move');
    });
  });
}); 