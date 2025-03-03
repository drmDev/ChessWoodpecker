import { LichessPuzzleResponse, Puzzle, processPuzzleData } from '../models/PuzzleModel';

// Sample Lichess API response for testing
const sampleLichessResponse: LichessPuzzleResponse = {
  game: {
    id: 'abcd1234',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6',
    clock: '300+3',
    perf: {
      icon: 'rapid',
      name: 'Rapid'
    },
    players: {
      white: { name: 'Player1', rating: 1800 },
      black: { name: 'Player2', rating: 1750 }
    }
  },
  puzzle: {
    id: 'puzzle123',
    rating: 1500,
    plays: 1000,
    solution: ['a2a4', 'a6a5', 'a4a5'],
    initialPly: 6,
    themes: ['opening', 'advantage']
  }
};

describe('Puzzle Data Model', () => {
  describe('LichessPuzzleResponse Interface', () => {
    it('should have the correct structure', () => {
      // This test just verifies that the TypeScript compiler accepts our sample data
      // as a valid LichessPuzzleResponse
      expect(sampleLichessResponse).toBeDefined();
      expect(sampleLichessResponse.game.id).toBe('abcd1234');
      expect(sampleLichessResponse.puzzle.id).toBe('puzzle123');
      expect(sampleLichessResponse.puzzle.solution).toHaveLength(3);
    });
  });

  describe('Puzzle Interface', () => {
    it('should have the correct structure', () => {
      // Create a sample Puzzle object
      const samplePuzzle: Puzzle = {
        id: 'puzzle123',
        rating: 1500,
        themes: ['opening', 'advantage'],
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        pgn: '1. e4 e5 2. Nf3',
        initialPly: 3,
        isWhiteToMove: false,
        solutionMovesUCI: ['g8f6', 'e4e5'],
        solutionMovesSAN: ['Nf6', 'e5'],
        gameId: 'abcd1234',
        playerWhite: 'Player1',
        playerBlack: 'Player2',
        attempts: 0
      };

      expect(samplePuzzle).toBeDefined();
      expect(samplePuzzle.id).toBe('puzzle123');
      expect(samplePuzzle.isWhiteToMove).toBe(false);
      expect(samplePuzzle.solutionMovesUCI).toHaveLength(2);
      expect(samplePuzzle.solutionMovesSAN).toHaveLength(2);
    });
  });

  // Note: We'll implement the processPuzzleData function in a later step
  // This is just a placeholder test to ensure our interfaces are correct
  describe('processPuzzleData function', () => {
    it('should transform LichessPuzzleResponse to Puzzle', () => {
      // This test will be implemented later
      expect(processPuzzleData).toBeDefined();
    });
  });
}); 