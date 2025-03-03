import { jest } from '@jest/globals';
import fs from 'fs';
import * as FileSystem from 'expo-file-system';
import { 
  saveCachedPuzzles, 
  getCachedPuzzle, 
  addPuzzleToCache, 
  clearCache,
  initializeCache,
  getCachedPuzzles,
  CachedPuzzle
} from '../services/PuzzleCacheService';
import { LichessPuzzleResponse } from '../models/PuzzleModel';

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test-directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

// Sample puzzle data for testing
const samplePuzzleData: CachedPuzzle = {
  id: 'test123',
  pgn: '1. e4 e5 2. Nf3 Nc6',
  initialFen: 'rnbqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  initialPly: 4,
  solution: ['d2d4', 'e5d4', 'f3d4']
};

const sampleLichessResponse: LichessPuzzleResponse = {
  game: {
    id: 'abcd1234',
    pgn: '1. e4 e5 2. Nf3 Nc6',
  },
  puzzle: {
    id: 'test123',
    rating: 1500,
    plays: 1000,
    solution: ['d2d4', 'e5d4', 'f3d4'],
    initialPly: 4,
    themes: ['opening', 'advantage']
  }
};

describe('PuzzleCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: true, isDirectory: false });
    (FileSystem.readAsStringAsync as any).mockResolvedValue(JSON.stringify({
      puzzles: {
        test123: samplePuzzleData
      }
    }));
    (FileSystem.writeAsStringAsync as any).mockResolvedValue(undefined);
    (FileSystem.deleteAsync as any).mockResolvedValue(undefined);
    (FileSystem.makeDirectoryAsync as any).mockResolvedValue(undefined);
  });

  describe('initializeCache', () => {
    it('should create cache directory if it does not exist', async () => {
      // Setup: Directory doesn't exist
      (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });
      
      await initializeCache();
      
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        'file://test-directory/puzzlecache', 
        { intermediates: true }
      );
    });

    it('should create empty cache file if it does not exist', async () => {
      // Setup: File doesn't exist
      (FileSystem.getInfoAsync as any)
        .mockResolvedValueOnce({ exists: true }) // Directory exists
        .mockResolvedValueOnce({ exists: false }); // File doesn't exist
      
      await initializeCache();
      
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        'file://test-directory/puzzlecache/cached_puzzles.json',
        JSON.stringify({ puzzles: {} })
      );
    });
  });

  describe('getCachedPuzzle', () => {
    it('should return a cached puzzle if it exists', async () => {
      const puzzle = await getCachedPuzzle('test123');
      
      expect(puzzle).toEqual(samplePuzzleData);
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        'file://test-directory/puzzlecache/cached_puzzles.json'
      );
    });

    it('should return null if puzzle does not exist in cache', async () => {
      const puzzle = await getCachedPuzzle('nonexistent');
      
      expect(puzzle).toBeNull();
    });

    it('should return null if cache file does not exist', async () => {
      // Setup: File doesn't exist
      (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });
      
      const puzzle = await getCachedPuzzle('test123');
      
      expect(puzzle).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      // Setup: Invalid JSON
      (FileSystem.readAsStringAsync as any).mockResolvedValue('invalid json');
      
      const puzzle = await getCachedPuzzle('test123');
      
      expect(puzzle).toBeNull();
    });
  });

  describe('addPuzzleToCache', () => {
    it('should add a puzzle to the cache', async () => {
      await addPuzzleToCache(sampleLichessResponse);
      
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      const writeCall = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      
      expect(writtenData.puzzles.test123).toBeDefined();
      expect(writtenData.puzzles.test123.pgn).toEqual('1. e4 e5 2. Nf3 Nc6');
      expect(writtenData.puzzles.test123.solution).toEqual(['d2d4', 'e5d4', 'f3d4']);
    });

    it('should create the cache file if it does not exist', async () => {
      // Setup: File doesn't exist
      (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });
      
      await addPuzzleToCache(sampleLichessResponse);
      
      // Should initialize cache and write file
      // When cache is initialized, writeAsStringAsync is called once to create the empty cache
      // When addPuzzleToCache is called, it calls saveCachedPuzzles which calls writeAsStringAsync again
      // In our implementation, saveCachedPuzzles also calls initializeCache for safety, which can result in an additional write
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('cached_puzzles.json'),
        expect.stringContaining('test123')
      );
    });

    it('should update an existing puzzle in the cache', async () => {
      // Setup: Puzzle already exists with different data
      (FileSystem.readAsStringAsync as any).mockResolvedValue(JSON.stringify({ 
        puzzles: { 
          test123: {
            id: 'test123',
            pgn: 'old pgn',
            initialFen: 'old fen',
            initialPly: 2,
            solution: ['old', 'solution']
          } 
        } 
      }));
      
      await addPuzzleToCache(sampleLichessResponse);
      
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      const writeCall = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      
      expect(writtenData.puzzles.test123.pgn).toEqual('1. e4 e5 2. Nf3 Nc6');
    });
  });

  describe('clearCache', () => {
    it('should delete the cache file', async () => {
      await clearCache();
      
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        'file://test-directory/puzzlecache/cached_puzzles.json',
        { idempotent: true }
      );
    });
  });

  describe('getCachedPuzzles', () => {
    it('should return all cached puzzles', async () => {
      const puzzles = await getCachedPuzzles();
      
      expect(puzzles).toEqual({ test123: samplePuzzleData });
    });

    it('should return empty object if cache file does not exist', async () => {
      // Setup: File doesn't exist
      (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });
      
      const puzzles = await getCachedPuzzles();
      
      expect(puzzles).toEqual({});
    });
  });

  describe('saveCachedPuzzles', () => {
    it('should save puzzles to the cache file', async () => {
      const puzzles = { test123: samplePuzzleData };
      
      await saveCachedPuzzles(puzzles);
      
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        'file://test-directory/puzzlecache/cached_puzzles.json',
        JSON.stringify({ puzzles })
      );
    });
  });
}); 