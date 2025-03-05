import { renderHook, act } from '@testing-library/react-native';
import { usePuzzleGame } from '../usePuzzleGame';
import { validatePuzzleMove } from '../../utils/chess/PuzzleMoveValidator';
import { playSound } from '../../utils/sounds';

// Mock dependencies
jest.mock('../../utils/chess/PuzzleMoveValidator');
jest.mock('../../utils/sounds');
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
    const { result } = renderHook(() => usePuzzleGame());
    
    expect(result.current.currentPosition).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.current.currentMoveIndex).toBe(0);
  });

  it('handles correct moves and updates position', () => {
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: true,
      isComplete: false,
      nextMove: 'e7e5',
    });

    const { result } = renderHook(() => usePuzzleGame());

    act(() => {
      result.current.handleMove('e2', 'e4');
    });

    expect(validatePuzzleMove).toHaveBeenCalledWith(
      expect.any(Object), // chess instance
      { from: 'e2', to: 'e4' },
      ['e2e4', 'e7e5', 'g1f3'],
      0
    );

    // Should not play success sound for intermediate moves
    expect(playSound).not.toHaveBeenCalledWith('success');
  });

  it('handles puzzle completion', () => {
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: true,
      isComplete: true,
      nextMove: null,
    });

    const { result } = renderHook(() => usePuzzleGame());

    act(() => {
      result.current.handleMove('g1', 'f3');
    });

    // Should play success sound on completion
    expect(playSound).toHaveBeenCalledWith('success');
  });

  it('handles incorrect moves', () => {
    (validatePuzzleMove as jest.Mock).mockReturnValue({
      isValid: false,
      isComplete: false,
      nextMove: null,
    });

    const { result } = renderHook(() => usePuzzleGame());

    act(() => {
      result.current.handleMove('e2', 'e3');
    });

    // Should play failure sound for incorrect moves
    expect(playSound).toHaveBeenCalledWith('failure');
  });

  // Add more tests as needed
}); 