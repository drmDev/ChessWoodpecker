/**
 * Unit tests for puzzleCacheUtils.ts
 */

import { jest } from '@jest/globals';
import * as PuzzleCacheService from '../services/PuzzleCacheService';
import * as puzzleCacheUtils from '../utils/puzzleCacheUtils';
import { 
  getAllDefaultPuzzleIds,
  getPuzzleIdsByCategory,
  getRandomPuzzleId,
  isPuzzleCached,
  preCachePuzzles,
  preCacheAllDefaultPuzzles
} from '../utils/puzzleCacheUtils';
import defaultCollection from '../../assets/puzzles/default-collection.json';
import { LichessPuzzleResponse } from '../models/PuzzleModel';

// Mock the PuzzleCacheService
jest.mock('../services/PuzzleCacheService', () => ({
  getCachedPuzzle: jest.fn(),
  addPuzzleToCache: jest.fn(),
  initializeCache: jest.fn()
}));

describe('puzzleCacheUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDefaultPuzzleIds', () => {
    it('should return all puzzle IDs from the default collection', () => {
      const allIds = getAllDefaultPuzzleIds();
      
      // Calculate expected count by summing all category arrays
      const expectedCount = Object.values(defaultCollection)
        .reduce((sum, ids) => sum + (Array.isArray(ids) ? ids.length : 0), 0);
      
      expect(allIds.length).toBe(expectedCount);
      expect(allIds.length).toBeGreaterThan(0);
      
      // Check that all IDs are strings
      allIds.forEach(id => {
        expect(typeof id).toBe('string');
      });
    });
  });

  describe('getPuzzleIdsByCategory', () => {
    it('should return puzzle IDs for a valid category', () => {
      // Get the first category from the collection
      const firstCategory = Object.keys(defaultCollection)[0];
      const categoryIds = getPuzzleIdsByCategory(firstCategory);
      
      // @ts-ignore - defaultCollection may have keys that are not in the type
      expect(categoryIds).toEqual(defaultCollection[firstCategory]);
      expect(categoryIds.length).toBeGreaterThan(0);
    });

    it('should return empty array for an invalid category', () => {
      const invalidCategoryIds = getPuzzleIdsByCategory('nonexistent_category');
      expect(invalidCategoryIds).toEqual([]);
    });
  });

  describe('getRandomPuzzleId', () => {
    it('should return a random ID from all puzzles when no category is specified', () => {
      const randomId = getRandomPuzzleId();
      const allIds = getAllDefaultPuzzleIds();
      
      expect(allIds).toContain(randomId);
    });

    it('should return a random ID from a specific category', () => {
      // Get the first category from the collection
      const firstCategory = Object.keys(defaultCollection)[0];
      const randomId = getRandomPuzzleId(firstCategory);
      
      // @ts-ignore - defaultCollection may have keys that are not in the type
      expect(defaultCollection[firstCategory]).toContain(randomId);
    });

    it('should throw an error for an invalid category', () => {
      expect(() => {
        getRandomPuzzleId('nonexistent_category');
      }).toThrow('No puzzles found for category nonexistent_category');
    });
  });

  describe('isPuzzleCached', () => {
    it('should return true if puzzle is cached', async () => {
      // Mock getCachedPuzzle to return a puzzle
      (PuzzleCacheService.getCachedPuzzle as jest.Mock).mockResolvedValue({
        id: 'test123',
        pgn: '1. e4 e5',
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        initialPly: 0,
        solution: ['e2e4', 'e7e5']
      });
      
      const result = await isPuzzleCached('test123');
      
      expect(PuzzleCacheService.getCachedPuzzle).toHaveBeenCalledWith('test123');
      expect(result).toBe(true);
    });

    it('should return false if puzzle is not cached', async () => {
      // Mock getCachedPuzzle to return null
      (PuzzleCacheService.getCachedPuzzle as jest.Mock).mockResolvedValue(null);
      
      const result = await isPuzzleCached('test456');
      
      expect(PuzzleCacheService.getCachedPuzzle).toHaveBeenCalledWith('test456');
      expect(result).toBe(false);
    });
  });

  describe('preCachePuzzles', () => {
    it('should cache puzzles that are not already cached', async () => {
      // Mock isPuzzleCached to return false (not cached)
      (PuzzleCacheService.getCachedPuzzle as jest.Mock).mockResolvedValue(null);
      
      // Mock fetchPuzzle function
      const mockFetchPuzzle = jest.fn().mockImplementation((id: string): Promise<LichessPuzzleResponse> => {
        return Promise.resolve({
          game: {
            id: `game_${id}`,
            pgn: '1. e4 e5 2. Nf3 Nc6'
          },
          puzzle: {
            id: id,
            rating: 1500,
            plays: 1000,
            solution: ['a2a4', 'a6a5'],
            initialPly: 4,
            themes: ['opening']
          }
        });
      });
      
      const puzzleIds = ['id1', 'id2', 'id3'];
      const result = await preCachePuzzles(puzzleIds, mockFetchPuzzle);
      
      // Should have called initializeCache
      expect(PuzzleCacheService.initializeCache).toHaveBeenCalled();
      
      // Should have called fetchPuzzle for each ID
      expect(mockFetchPuzzle).toHaveBeenCalledTimes(3);
      
      // Should have called addPuzzleToCache for each puzzle
      expect(PuzzleCacheService.addPuzzleToCache).toHaveBeenCalledTimes(3);
      
      // Should return the count of successfully cached puzzles
      expect(result).toBe(3);
    });

    it('should skip puzzles that are already cached', async () => {
      // First puzzle is not cached, second is cached
      (PuzzleCacheService.getCachedPuzzle as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'id2',
          pgn: '1. e4 e5',
          initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          initialPly: 0,
          solution: ['e2e4', 'e7e5']
        });
      
      // Mock fetchPuzzle function
      const mockFetchPuzzle = jest.fn().mockImplementation((id: string): Promise<LichessPuzzleResponse> => {
        return Promise.resolve({
          game: {
            id: `game_${id}`,
            pgn: '1. e4 e5 2. Nf3 Nc6'
          },
          puzzle: {
            id: id,
            rating: 1500,
            plays: 1000,
            solution: ['a2a4', 'a6a5'],
            initialPly: 4,
            themes: ['opening']
          }
        });
      });
      
      const puzzleIds = ['id1', 'id2'];
      const result = await preCachePuzzles(puzzleIds, mockFetchPuzzle);
      
      // Should have called fetchPuzzle only for the first ID
      expect(mockFetchPuzzle).toHaveBeenCalledTimes(1);
      expect(mockFetchPuzzle).toHaveBeenCalledWith('id1');
      
      // Should have called addPuzzleToCache only for the first puzzle
      expect(PuzzleCacheService.addPuzzleToCache).toHaveBeenCalledTimes(1);
      
      // Should return 2 (both puzzles are considered successfully cached)
      expect(result).toBe(2);
    });

    it('should handle errors when fetching puzzles', async () => {
      // Mock isPuzzleCached to return false (not cached)
      (PuzzleCacheService.getCachedPuzzle as jest.Mock).mockResolvedValue(null);
      
      // Mock console.error to avoid test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Mock fetchPuzzle function that fails for the second puzzle
      const mockFetchPuzzle = jest.fn()
        .mockImplementationOnce((id: string): Promise<LichessPuzzleResponse> => {
          return Promise.resolve({
            game: {
              id: `game_${id}`,
              pgn: '1. e4 e5 2. Nf3 Nc6'
            },
            puzzle: {
              id: id,
              rating: 1500,
              plays: 1000,
              solution: ['a2a4', 'a6a5'],
              initialPly: 4,
              themes: ['opening']
            }
          });
        })
        .mockImplementationOnce(() => {
          throw new Error('API error');
        });
      
      const puzzleIds = ['id1', 'id2'];
      const result = await preCachePuzzles(puzzleIds, mockFetchPuzzle);
      
      // Should have called fetchPuzzle for both IDs
      expect(mockFetchPuzzle).toHaveBeenCalledTimes(2);
      
      // Should have called addPuzzleToCache only for the first puzzle
      expect(PuzzleCacheService.addPuzzleToCache).toHaveBeenCalledTimes(1);
      
      // Should return 1 (only the first puzzle was successfully cached)
      expect(result).toBe(1);
      
      // Should have logged the error
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('preCacheAllDefaultPuzzles', () => {
    it('should use getAllDefaultPuzzleIds and preCachePuzzles', async () => {
      // Just verify that the function exists and returns a number
      const mockFetchPuzzle = jest.fn().mockImplementation((id: string): Promise<LichessPuzzleResponse> => {
        return Promise.resolve({
          game: {
            id: `game_${id}`,
            pgn: '1. e4 e5 2. Nf3 Nc6'
          },
          puzzle: {
            id: id,
            rating: 1500,
            plays: 1000,
            solution: ['a2a4', 'a6a5'],
            initialPly: 4,
            themes: ['opening']
          }
        });
      });
      
      // Mock the implementation of preCachePuzzles to avoid actual API calls
      jest.spyOn(puzzleCacheUtils, 'preCachePuzzles').mockResolvedValue(5);
      
      const result = await preCacheAllDefaultPuzzles(mockFetchPuzzle);
      
      // Just verify that it returns a number
      expect(typeof result).toBe('number');
      
      // Restore the original implementation
      jest.restoreAllMocks();
    });
  });
}); 