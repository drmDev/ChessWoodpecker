import { renderHook, act } from '@testing-library/react-native';
import { usePuzzleGame } from '../usePuzzleGame';
import { validatePuzzleMove } from '../../utils/chess/PuzzleMoveValidator';
import { playSound } from '../../utils/sounds';
import { Chess } from 'chess.js';

// Mock dependencies
jest.mock('../../utils/chess/PuzzleMoveValidator');
jest.mock('../../utils/sounds');
jest.mock('chess.js', () => {
  return {
    Chess: jest.fn().mockImplementation(() => ({
      load: jest.fn(),
      move: jest.fn(),
      get: jest.fn(),
      fen: jest.fn().mockReturnValue('test-fen'),
    })),
  };
});
jest.mock('../../contexts/AppStateContext', () => ({
  useAppState: () => ({
    state: {
      sessionData: {
        currentPuzzle: {
          id: 'test-puzzle',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          solutionMovesUCI: ['e2e4', 'e7e5', 'g1f3'],
          isWhiteToMove: true,
        },
      },
    },
    dispatch: jest.fn(),
  }),
}));

describe('usePuzzleGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    (validatePuzzleMove as jest.Mock).mockReset();
    (playSound as jest.Mock).mockReset();
  });

  it('initializes with correct starting position', () => {
    const { result } = renderHook(() => usePuzzleGame(jest.fn()));
    
    expect(result.current.currentPosition).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.current.currentMoveIndex).toBe(0);
  });

  it('handles correct moves and updates position', () => {
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: true,
      isComplete: false,
      nextMove: 'e7e5',
    });

    const { result } = renderHook(() => usePuzzleGame(jest.fn()));

    act(() => {
      result.current.handleMove('e2', 'e4');
    });

    expect(validatePuzzleMove).toHaveBeenCalledWith(
      expect.any(Object), // chess instance
      { from: 'e2', to: 'e4' },
      ['e2e4', 'e7e5', 'g1f3'],
      0
    );

    expect(playSound).not.toHaveBeenCalledWith('success');
  });

  it('handles puzzle completion', () => {
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: true,
      isComplete: true,
      nextMove: null,
    });

    const onPuzzleCompleteMock = jest.fn();
    const { result } = renderHook(() => usePuzzleGame(onPuzzleCompleteMock));

    act(() => {
      result.current.handleMove('g1', 'f3');
    });

    expect(playSound).toHaveBeenCalledWith('success');
    expect(onPuzzleCompleteMock).toHaveBeenCalled();
  });

  it('handles pawn promotion to queen', () => {
    // Mock the chess.js get method to simulate a pawn at the 7th rank
    const mockChessInstance = {
      load: jest.fn(),
      move: jest.fn(),
      get: jest.fn().mockReturnValue({ type: 'p', color: 'w' }),
      fen: jest.fn().mockReturnValue('test-fen'),
    };
    
    // Update the Chess constructor mock for this test
    (Chess as jest.Mock).mockImplementation(() => mockChessInstance);
    
    // Setup the validation mock to return a successful promotion
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: true,
      isComplete: true,
      nextMove: null,
    });

    const onPuzzleCompleteMock = jest.fn();
    const { result } = renderHook(() => usePuzzleGame(onPuzzleCompleteMock));

    // Attempt the promotion move from e7 to e8
    act(() => {
      result.current.handleMove('e7', 'e8');
    });

    // Verify that validatePuzzleMove was called with the correct promotion notation
    expect(validatePuzzleMove).toHaveBeenCalledWith(
      expect.any(Object), // chess instance
      { from: 'e7', to: 'e8q' }, // Should append 'q' for queen promotion
      ['e2e4', 'e7e5', 'g1f3'],
      0
    );

    // Verify success sound and completion callback
    expect(playSound).toHaveBeenCalledWith('success');
    expect(onPuzzleCompleteMock).toHaveBeenCalled();
  });

  it('handles incorrect moves', () => {
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: false,
      isComplete: false,
      nextMove: null,
    });

    const { result } = renderHook(() => usePuzzleGame(jest.fn()));

    act(() => {
      result.current.handleMove('e2', 'e3');
    });

    // Should play failure sound for incorrect moves
    expect(playSound).toHaveBeenCalledWith('failure');
  });

  // Add more tests as needed
}); 