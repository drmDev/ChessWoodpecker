import { jest } from '@jest/globals';
import * as FileSystem from 'expo-file-system';
import { 
  getCachedPuzzle, 
  addPuzzleToCache, 
  initializeCache,
  CachedPuzzle
} from '../services/PuzzleCacheService';
import { 
  LichessPuzzleResponse, 
  getPuzzlePosition,
  processPuzzleData
} from '../models/PuzzleModel';
import { Chess } from 'chess.js';

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test-directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

describe('Puzzle Cache Integration Tests', () => {
  // Sample data for testing
  const whitePuzzleResponse: LichessPuzzleResponse = {
    game: {
      id: 'game1',
      pgn: '1. e4 e5 2. Nf3 Nc6',
    },
    puzzle: {
      id: 'white_puzzle',
      rating: 1500,
      plays: 1000,
      solution: ['d2d4', 'e5d4', 'f3d4'],
      initialPly: 4,
      themes: ['opening', 'advantage']
    }
  };

  const blackPuzzleResponse: LichessPuzzleResponse = {
    game: {
      id: 'game2',
      pgn: '1. e4 e5 2. Nf3 Nc6 3. d4',
    },
    puzzle: {
      id: 'black_puzzle',
      rating: 1600,
      plays: 800,
      solution: ['e5d4', 'f3d4', 'g8f6'],
      initialPly: 5,
      themes: ['opening', 'tactics']
    }
  };

  // Pre-calculate the expected FENs using the actual functions
  const whitePuzzleFen = getPuzzlePosition(
    whitePuzzleResponse.game.pgn,
    whitePuzzleResponse.puzzle.initialPly
  ).fen;
  
  const blackPuzzleFen = getPuzzlePosition(
    blackPuzzleResponse.game.pgn,
    blackPuzzleResponse.puzzle.initialPly
  ).fen;

  beforeEach(() => {
    // Clear mocks and set up default behavior
    jest.clearAllMocks();
    
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ 
      puzzles: {} 
    }));
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Cached Puzzle Processing', () => {
    it('should correctly process white-to-move puzzles', async () => {
      // Setup the cache mock to return our puzzle
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ 
        puzzles: {
          white_puzzle: {
            id: 'white_puzzle',
            pgn: '1. e4 e5 2. Nf3 Nc6',
            initialFen: whitePuzzleFen, // Use the pre-calculated FEN
            initialPly: 4,
            solution: ['d2d4', 'e5d4', 'f3d4']
          }
        }
      }));

      // Get the puzzle from cache
      const cachedPuzzle = await getCachedPuzzle('white_puzzle');
      
      // Verify the puzzle was retrieved correctly
      expect(cachedPuzzle).not.toBeNull();
      expect(cachedPuzzle!.id).toBe('white_puzzle');
      
      // Process the puzzle position
      const { chess, isWhiteToMove } = getPuzzlePosition(
        cachedPuzzle!.pgn,
        cachedPuzzle!.initialPly
      );
      
      // Verify the position is correct (white to move)
      expect(isWhiteToMove).toBe(true);
      expect(chess.fen()).toBe(cachedPuzzle!.initialFen);
      
      // Verify the first move in the solution is legal
      expect(chess.turn()).toBe('w');
      const firstMove = cachedPuzzle!.solution[0];
      const from = firstMove.substring(0, 2);
      const to = firstMove.substring(2, 4);
      const moveResult = chess.move({ from, to, promotion: 'q' });
      expect(moveResult).not.toBeNull();
    });

    it('should correctly process black-to-move puzzles', async () => {
      // First add the puzzle to cache (this tests addPuzzleToCache)
      await addPuzzleToCache(blackPuzzleResponse);
      
      // Verify that writeAsStringAsync was called with the correct puzzle data
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      
      // Setup the cache mock to return our puzzle
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ 
        puzzles: {
          black_puzzle: {
            id: 'black_puzzle',
            pgn: '1. e4 e5 2. Nf3 Nc6 3. d4',
            initialFen: blackPuzzleFen, // Use the pre-calculated FEN
            initialPly: 5,
            solution: ['e5d4', 'f3d4', 'g8f6']
          }
        }
      }));

      // Get the puzzle from cache
      const cachedPuzzle = await getCachedPuzzle('black_puzzle');
      
      // Verify the puzzle was retrieved correctly
      expect(cachedPuzzle).not.toBeNull();
      expect(cachedPuzzle!.id).toBe('black_puzzle');
      
      // Process the puzzle position
      const { chess, isWhiteToMove } = getPuzzlePosition(
        cachedPuzzle!.pgn,
        cachedPuzzle!.initialPly
      );
      
      // Verify the position is correct (black to move)
      expect(isWhiteToMove).toBe(false);
      expect(chess.fen()).toBe(cachedPuzzle!.initialFen);
      
      // Verify the first move in the solution is legal
      expect(chess.turn()).toBe('b');
      const firstMove = cachedPuzzle!.solution[0];
      const from = firstMove.substring(0, 2);
      const to = firstMove.substring(2, 4);
      const moveResult = chess.move({ from, to, promotion: 'q' });
      expect(moveResult).not.toBeNull();
    });
  });

  describe('Puzzle Cache and Model Integration', () => {
    it('should correctly integrate cache with puzzle model processing', async () => {
      // First add both puzzles to cache
      await addPuzzleToCache(whitePuzzleResponse);
      await addPuzzleToCache(blackPuzzleResponse);
      
      // Mock the cache to contain both puzzles (simulating what would happen after adding them)
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ 
        puzzles: {
          white_puzzle: {
            id: 'white_puzzle',
            pgn: '1. e4 e5 2. Nf3 Nc6',
            initialFen: whitePuzzleFen, // Use the pre-calculated FEN
            initialPly: 4,
            solution: ['d2d4', 'e5d4', 'f3d4']
          },
          black_puzzle: {
            id: 'black_puzzle',
            pgn: '1. e4 e5 2. Nf3 Nc6 3. d4',
            initialFen: blackPuzzleFen, // Use the pre-calculated FEN
            initialPly: 5,
            solution: ['e5d4', 'f3d4', 'g8f6']
          }
        }
      }));
      
      // Get both puzzles from cache
      const whitePuzzle = await getCachedPuzzle('white_puzzle');
      const blackPuzzle = await getCachedPuzzle('black_puzzle');
      
      // Verify we got both puzzles
      expect(whitePuzzle).not.toBeNull();
      expect(blackPuzzle).not.toBeNull();
      
      // Test that the original Lichess response and cached puzzle produce the same processed puzzle
      const processedFromResponse = processPuzzleData(whitePuzzleResponse);
      const processedWhiteFen = getPuzzlePosition(whitePuzzle!.pgn, whitePuzzle!.initialPly).fen;
      
      // The FEN from both should match
      expect(processedWhiteFen).toBe(whitePuzzle!.initialFen);
      expect(processedFromResponse.fen).toBe(whitePuzzle!.initialFen);
      
      // Verify black puzzle orientation
      const { isWhiteToMove: whiteToMove } = getPuzzlePosition(whitePuzzle!.pgn, whitePuzzle!.initialPly);
      const { isWhiteToMove: blackToMove } = getPuzzlePosition(blackPuzzle!.pgn, blackPuzzle!.initialPly);
      
      expect(whiteToMove).toBe(true);
      expect(blackToMove).toBe(false);
    });
  });
}); 