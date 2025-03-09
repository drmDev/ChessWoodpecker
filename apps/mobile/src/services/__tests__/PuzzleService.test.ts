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
    theme: 'Opening',
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
    
    // Reset the puzzle service session
    puzzleService.clearSession();
    
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
  
  describe('Session-based puzzle functionality', () => {
    it('should initialize a session with shuffled puzzles', () => {
      const count = puzzleService.initializeSession();
      
      // Our mock has 4 puzzles, so we should get all of them
      expect(count).toBe(4);
      expect(puzzleService.getRemainingPuzzleCount()).toBe(4);
    });

    it('should return puzzles in sequence from the session queue', async () => {
      // Setup cache miss but successful backend fetch
      jest.spyOn(PuzzleCacheService, 'getPuzzle').mockResolvedValue(null);
      jest.spyOn(PuzzleCacheService, 'storePuzzle').mockResolvedValue();
      
      // Initialize session
      puzzleService.initializeSession();
      
      // Get all puzzles from the queue
      const puzzles = [];
      let puzzle = await puzzleService.getNextSessionPuzzle();
      
      while (puzzle) {
        puzzles.push(puzzle);
        puzzle = await puzzleService.getNextSessionPuzzle();
      }
      
      // Should have 4 unique puzzles (from our mock collection)
      expect(puzzles.length).toBe(4);
      
      // All puzzles should be unique
      const uniqueIds = new Set(puzzles.map(p => p.id));
      expect(uniqueIds.size).toBe(4);
      
      // Queue should be empty now
      expect(puzzleService.getRemainingPuzzleCount()).toBe(0);
    });

    it('should return null when session queue is empty', async () => {
      // Initialize and then clear session
      puzzleService.initializeSession();
      puzzleService.clearSession();
      
      const puzzle = await puzzleService.getNextSessionPuzzle();
      expect(puzzle).toBeNull();
    });

    it('should return null when throwError is false and there is an error', async () => {
      // Setup cache miss and backend error
      jest.spyOn(PuzzleCacheService, 'getPuzzle').mockResolvedValue(null);
      
      // Important: Override the global fetch mock for this specific test
      (global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      });
      
      const result = await puzzleService.fetchPuzzleById('test123', false);
      expect(result).toBeNull();
    });
  });
});