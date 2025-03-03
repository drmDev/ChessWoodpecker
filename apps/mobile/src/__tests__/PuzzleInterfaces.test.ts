import { 
  LichessPuzzleResponse, 
  Puzzle, 
  PuzzleProgress, 
  PuzzleCollection 
} from '../models/PuzzleModel';

describe('Puzzle Interfaces', () => {
  describe('LichessPuzzleResponse Interface', () => {
    it('should handle optional fields correctly', () => {
      // Create a minimal valid response without optional fields
      const minimalResponse: LichessPuzzleResponse = {
        game: {
          id: 'game123',
          pgn: '1. e4 e5'
        },
        puzzle: {
          id: 'puzzle123',
          rating: 1500,
          plays: 1000,
          solution: ['e2e4'],
          initialPly: 2,
          themes: ['opening']
        }
      };

      expect(minimalResponse).toBeDefined();
      expect(minimalResponse.game.clock).toBeUndefined();
      expect(minimalResponse.game.perf).toBeUndefined();
      expect(minimalResponse.game.players).toBeUndefined();
    });
  });

  describe('Puzzle Interface', () => {
    it('should handle optional fields correctly', () => {
      // Create a minimal valid puzzle without optional fields
      const minimalPuzzle: Puzzle = {
        id: 'puzzle123',
        rating: 1500,
        themes: ['opening'],
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        pgn: '1. e4',
        initialPly: 1,
        isWhiteToMove: false,
        solutionMovesUCI: ['e7e5'],
        solutionMovesSAN: ['e5'],
        attempts: 0
      };

      expect(minimalPuzzle).toBeDefined();
      expect(minimalPuzzle.gameId).toBeUndefined();
      expect(minimalPuzzle.playerWhite).toBeUndefined();
      expect(minimalPuzzle.playerBlack).toBeUndefined();
      expect(minimalPuzzle.lastAttemptedAt).toBeUndefined();
      expect(minimalPuzzle.succeeded).toBeUndefined();
      expect(minimalPuzzle.successRate).toBeUndefined();
      expect(minimalPuzzle.nextRepetitionDate).toBeUndefined();
      expect(minimalPuzzle.repetitionLevel).toBeUndefined();
    });
  });

  describe('PuzzleProgress Interface', () => {
    it('should have the correct structure', () => {
      const progress: PuzzleProgress = {
        puzzleId: 'puzzle123',
        attempts: 3,
        lastAttemptedAt: Date.now(),
        succeeded: true,
        repetitionLevel: 2,
        nextRepetitionDate: Date.now() + 86400000 // tomorrow
      };

      expect(progress).toBeDefined();
      expect(progress.puzzleId).toBe('puzzle123');
      expect(progress.attempts).toBe(3);
      expect(progress.succeeded).toBe(true);
      expect(progress.repetitionLevel).toBe(2);
      expect(typeof progress.nextRepetitionDate).toBe('number');
    });

    it('should handle optional fields correctly', () => {
      const minimalProgress: PuzzleProgress = {
        puzzleId: 'puzzle123',
        attempts: 1,
        lastAttemptedAt: Date.now(),
        succeeded: false
      };

      expect(minimalProgress).toBeDefined();
      expect(minimalProgress.repetitionLevel).toBeUndefined();
      expect(minimalProgress.nextRepetitionDate).toBeUndefined();
    });
  });

  describe('PuzzleCollection Interface', () => {
    it('should have the correct structure', () => {
      const collection: PuzzleCollection = {
        id: 'col123',
        name: 'Opening Tactics',
        description: 'Puzzles focused on opening tactics',
        puzzleIds: ['puzzle1', 'puzzle2', 'puzzle3'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      expect(collection).toBeDefined();
      expect(collection.id).toBe('col123');
      expect(collection.name).toBe('Opening Tactics');
      expect(collection.description).toBe('Puzzles focused on opening tactics');
      expect(collection.puzzleIds).toHaveLength(3);
      expect(typeof collection.createdAt).toBe('number');
      expect(typeof collection.updatedAt).toBe('number');
    });

    it('should handle optional fields correctly', () => {
      const minimalCollection: PuzzleCollection = {
        id: 'col123',
        name: 'Opening Tactics',
        puzzleIds: ['puzzle1', 'puzzle2'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      expect(minimalCollection).toBeDefined();
      expect(minimalCollection.description).toBeUndefined();
    });
  });
}); 