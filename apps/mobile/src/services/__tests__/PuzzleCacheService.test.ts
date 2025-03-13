import AsyncStorage from '@react-native-async-storage/async-storage';
import { PuzzleCacheService } from '../PuzzleCacheService';
import { Puzzle } from '../../models/PuzzleModel';
import { FEN_AFTER_E4_E5 } from '../../utils/testing/chess-test-utils';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock console methods
const originalConsole = { ...console };

// Setup and teardown
beforeEach(() => {
  console.debug = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('PuzzleCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize AsyncStorage mock state
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Sample puzzle for testing
  const mockPuzzle: Puzzle = {
    id: 'test123',
    pgn: '1. e4 e5',
    fen: FEN_AFTER_E4_E5,
    theme: 'opening',
    initialPly: 2,
    isWhiteToMove: true,
    solutionMovesUCI: ['g1f3'],
    solutionMovesSAN: ['Nf3'],
    attempts: 0
  };

  describe('getPuzzle', () => {
    it('should return null when puzzle is not in cache', async () => {
      // Setup cache miss
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await PuzzleCacheService.getPuzzle('nonexistent');
      
      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('puzzle_nonexistent');
    });

    it('should return puzzle when found in cache', async () => {
      // Setup cache hit
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockPuzzle));

      const result = await PuzzleCacheService.getPuzzle('test123');
      
      expect(result).toEqual(mockPuzzle);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('puzzle_test123');
    });

    it('should handle errors gracefully', async () => {
      // Setup error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await PuzzleCacheService.getPuzzle('test123');
      
      expect(result).toBeNull();
    });
  });

  describe('storePuzzle', () => {
    it('should store puzzle in AsyncStorage', async () => {
      await PuzzleCacheService.storePuzzle(mockPuzzle);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'puzzle_test123',
        expect.any(String)
      );
    });

    it('should throw error when storage fails', async () => {
      // Setup error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(PuzzleCacheService.storePuzzle(mockPuzzle)).rejects.toThrow();
    });
  });

  describe('getCachedPuzzleIds', () => {
    it('should return puzzle IDs from cache keys', async () => {
      // Setup mock data
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'puzzle_123', 
        'puzzle_456', 
        'other_key'
      ]);
      
      const result = await PuzzleCacheService.getCachedPuzzleIds();
      
      expect(result).toEqual(['123', '456']);
    });

    it('should return empty array when no puzzles in cache', async () => {
      // Setup empty cache
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['other_key']);
      
      const result = await PuzzleCacheService.getCachedPuzzleIds();
      
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      // Setup error
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const result = await PuzzleCacheService.getCachedPuzzleIds();
      
      expect(result).toEqual([]);
    });
  });
}); 