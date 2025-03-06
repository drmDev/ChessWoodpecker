import { Chess } from 'chess.js';
import { 
  convertUciToSan, 
  isMoveLegal, 
  getPuzzlePosition,
  processPuzzleData,
  LichessPuzzleResponse
} from '../PuzzleModel';

describe('PuzzleModel', () => {
  describe('convertUciToSan', () => {
    let chess: Chess;

    beforeEach(() => {
      chess = new Chess();
    });

    it('should convert basic pawn move', () => {
      expect(convertUciToSan(chess, 'e2e4')).toBe('e4');
    });

    it('should convert knight move', () => {
      expect(convertUciToSan(chess, 'g1f3')).toBe('Nf3');
    });

    it('should convert promotion move', () => {
      // Set up a position where promotion is possible
      const fen = '8/4P3/8/8/8/k7/8/K7 w - - 0 1';
      chess.load(fen);
      
      // Verify the position is valid
      expect(chess.fen()).toBe(fen);
      expect(chess.get('e7')).toEqual({ type: 'p', color: 'w' });
      expect(chess.moves({ square: 'e7' })).toContain('e8=Q');

      // Test all promotion variants
      expect(convertUciToSan(chess, 'e7e8q')).toBe('e8=Q');
      expect(convertUciToSan(chess, 'e7e8r')).toBe('e8=R');
      expect(convertUciToSan(chess, 'e7e8b')).toBe('e8=B');
      expect(convertUciToSan(chess, 'e7e8n')).toBe('e8=N');
    });

    it('should return null for invalid move', () => {
      expect(convertUciToSan(chess, 'e2e5')).toBe(null);
    });
  });

  describe('isMoveLegal', () => {
    let chess: Chess;

    beforeEach(() => {
      chess = new Chess();
    });

    it('should return true for legal moves', () => {
      expect(isMoveLegal(chess, 'e2e4')).toBe(true);
      expect(isMoveLegal(chess, 'g1f3')).toBe(true);
    });

    it('should return false for illegal moves', () => {
      expect(isMoveLegal(chess, 'e2e5')).toBe(false);
      expect(isMoveLegal(chess, 'a2a1')).toBe(false);
    });
  });

  describe('getPuzzlePosition', () => {
    it('should return correct position from PGN', () => {
      const pgn = '1. e4 e5 2. Nf3';
      const initialPly = 3;  // After 2. Nf3
      
      const result = getPuzzlePosition(pgn, initialPly);
      
      expect(result.isWhiteToMove).toBe(false);
      expect(result.chess.turn()).toBe('b');
      expect(result.chess.fen()).toContain('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b');
    });

    it('should handle invalid PGN gracefully', () => {
      expect(() => getPuzzlePosition('invalid pgn', 0))
        .toThrow('Error processing puzzle position: Invalid PGN format');
    });
  });

  describe('processPuzzleData', () => {
    const samplePuzzleData: LichessPuzzleResponse = {
      game: {
        id: 'abc123',
        pgn: '1. e4 e5 2. Nf3 Nc6',
        clock: null,
        players: {
          white: { name: 'Player1', rating: 1500 },
          black: { name: 'Player2', rating: 1600 }
        }
      },
      puzzle: {
        id: 'puzzle123',
        rating: 1800,
        plays: 100,
        solution: ['d2d4'],  // A valid move after 1. e4 e5 2. Nf3 Nc6
        initialPly: 4,       // After black's second move (Nc6)
        themes: ['opening', 'middlegame']
      }
    };

    it('should process puzzle data correctly', () => {
      const result = processPuzzleData(samplePuzzleData);

      expect(result.id).toBe('puzzle123');
      expect(result.rating).toBe(1800);
      expect(result.plays).toBe(100);
      expect(result.themes).toEqual(['opening', 'middlegame']);
      expect(result.solutionMovesUCI).toEqual(['d2d4']);
      expect(result.solutionMovesSAN).toContain('d4');  // The SAN for d2d4
      expect(result.playerWhite).toBe('Player1');
      expect(result.playerBlack).toBe('Player2');
      expect(result.attempts).toBe(0);
      expect(result.isWhiteToMove).toBe(true);  // After 4 half-moves, it's white's turn
    });

    it('should handle errors gracefully', () => {
      const invalidData = {
        ...samplePuzzleData,
        game: {
          ...samplePuzzleData.game,
          pgn: 'invalid pgn'
        }
      };

      expect(() => processPuzzleData(invalidData as LichessPuzzleResponse))
        .toThrow('Failed to process puzzle data');
    });
  });
}); 