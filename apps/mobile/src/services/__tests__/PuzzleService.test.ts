import { puzzleService } from '../PuzzleService';
import { PuzzleCacheService } from '../PuzzleCacheService';
import { Puzzle } from '../../models/PuzzleModel';

// Mock the default collection
jest.mock('../../../assets/puzzles/default-collection.json', () => ({
  easy: ['abc12', 'def34'],
  medium: ['ghi56', 'jkl78']
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiGet: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('PuzzleService', () => {
  const mockPuzzleResponse = {
    lichess_puzzle_id: 'abc12',
    pgn: '1. e4 e5 2. Nf3',
    initial_ply: 4,
    solution: ['d2d4', 'e5d4']
  };

  const mockProcessedPuzzle: Puzzle = {
    id: 'abc12',
    pgn: '1. e4 e5 2. Nf3',
    initialPly: 4,
    solutionMovesUCI: ['d2d4', 'e5d4'],
    solutionMovesSAN: ['d4', 'dxe4'],
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    isWhiteToMove: true,
    attempts: 0
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      // Extract puzzle ID from URL
      const puzzleId = url.split('/').pop();
      return {
        ok: true,
        json: () => Promise.resolve({
          ...mockPuzzleResponse,
          lichess_puzzle_id: puzzleId
        })
      };
    });
  });

  describe('fetchRandomPuzzle', () => {
    it('should return a cached puzzle if available', async () => {
      // Setup cache hit
      jest.spyOn(PuzzleCacheService, 'getPuzzle').mockResolvedValue(mockProcessedPuzzle);

      const result = await puzzleService.fetchRandomPuzzle();

      expect(result).toEqual(mockProcessedPuzzle);
      expect(PuzzleCacheService.getPuzzle).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch from backend and cache when puzzle not in cache', async () => {
      // Setup cache miss
      jest.spyOn(PuzzleCacheService, 'getPuzzle').mockResolvedValue(null);
      jest.spyOn(PuzzleCacheService, 'storePuzzle').mockResolvedValue();

      const result = await puzzleService.fetchRandomPuzzle();

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(PuzzleCacheService.getPuzzle).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
      expect(PuzzleCacheService.storePuzzle).toHaveBeenCalled();
    });

    it('should handle backend errors gracefully', async () => {
      // Setup cache miss and backend error
      jest.spyOn(PuzzleCacheService, 'getPuzzle').mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(puzzleService.fetchRandomPuzzle()).rejects.toThrow('Backend returned status 404');
    });

    it('should select a random puzzle from the collection', async () => {
      // Setup cache miss
      jest.spyOn(PuzzleCacheService, 'getPuzzle').mockResolvedValue(null);
      jest.spyOn(PuzzleCacheService, 'storePuzzle').mockResolvedValue();

      // Call multiple times to ensure randomness
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        const result = await puzzleService.fetchRandomPuzzle();
        results.add(result.id);
      }

      // Should have seen at least 2 different IDs (it's random, but very unlikely to get same ID 10 times)
      expect(results.size).toBeGreaterThan(1);
    });
  });
});