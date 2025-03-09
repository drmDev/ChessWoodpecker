import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { validatePuzzleMove } from '../utils/chess/PuzzleMoveValidator';
import { playSound, SoundTypes } from '../utils/sounds';
import { useAppState } from '../contexts/AppStateContext';
import { Puzzle } from '../models/PuzzleModel';
import { extractMoveComponents, isPromotionMove, replayMoves, getMoveType } from '../utils/chess/PuzzleLogic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerHaptic } from '../utils/haptics';

interface PuzzleGameState {
  currentPosition: string | null;
  currentMoveIndex: number;
  onPuzzleComplete: () => void;
  isOpponentMoving: boolean;
  isUserTurn: boolean;
  isGameOver: boolean;
  isAutoSolving: boolean;
}

interface PuzzleGameActions {
  handleMove: (from: string, to: string) => void;
  resetGame: (puzzle: Puzzle) => void;
  makeOpponentMove: () => Promise<void>;
  autoSolvePuzzle: () => Promise<void>;
}

// Delay between moves during auto-solve (in milliseconds)
const AUTO_SOLVE_MOVE_DELAY = 1000;
const NEXT_PUZZLE_DELAY = 2000;
const OPPONENT_MOVE_DELAY = 500;

/**
 * Custom hook that manages the puzzle game state and logic
 * Handles move validation, execution, and progression through the puzzle
 */
export function usePuzzleGame(
  onPuzzleComplete: () => void
): PuzzleGameState & PuzzleGameActions {
  const { state, dispatch } = useAppState();
  const [chessInstance] = useState(() => {
    return new Chess();
  });
  const [currentPosition, setCurrentPosition] = useState<string | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);

  // Add debug logging for state changes
  useEffect(() => {
    if (state.currentPuzzle) {
      console.log('Puzzle State Change:', {
        puzzleId: state.currentPuzzle.id,
        fen: state.currentPuzzle.fen,
        currentPosition,
        currentMoveIndex,
        chessInstanceFen: chessInstance.fen(),
        isAutoSolving,
        isOpponentMoving
      });
    }
  }, [state.currentPuzzle, currentPosition, currentMoveIndex]);

  // Reset game state when a new puzzle is loaded or session ends
  useEffect(() => {
    const puzzle = state.currentPuzzle;
    if (puzzle) {
      chessInstance.load(puzzle.fen);
      // Update all state synchronously to avoid intermediate states
      const newState = {
        position: puzzle.fen,
        moveIndex: 0,
        isOpponentMoving: false,
        isAutoSolving: false
      };
      setCurrentPosition(newState.position);
      setCurrentMoveIndex(newState.moveIndex);
      setIsOpponentMoving(newState.isOpponentMoving);
      setIsAutoSolving(newState.isAutoSolving);
    } else {
      chessInstance.reset(); // Reset to initial position
      // Update all state synchronously to avoid intermediate states
      const newState = {
        position: null,
        moveIndex: 0,
        isOpponentMoving: false,
        isAutoSolving: false
      };
      setCurrentPosition(newState.position);
      setCurrentMoveIndex(newState.moveIndex);
      setIsOpponentMoving(newState.isOpponentMoving);
      setIsAutoSolving(newState.isAutoSolving);
    }
  }, [state.currentPuzzle]);

  const resetGame = useCallback((puzzle: Puzzle) => {
    console.log('Resetting Game:', {
      puzzleId: puzzle.id,
      beforeResetFen: chessInstance.fen(),
      newPuzzleFen: puzzle.fen
    });
    
    chessInstance.load(puzzle.fen);
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    setIsOpponentMoving(false);
    setIsAutoSolving(false);

    console.log('After Reset:', {
      currentPosition: puzzle.fen,
      chessInstanceFen: chessInstance.fen()
    });
  }, [chessInstance]);

  const makeMove = useCallback(async (from: string, to: string, promotion?: string) => {
    const moveResult = chessInstance.move({ from, to, promotion });
    if (!moveResult) {
      return false;
    }

    const moveType = getMoveType(chessInstance, moveResult);
    await playSound(moveType);

    setCurrentPosition(chessInstance.fen());
    return true;
  }, [chessInstance]);

  const autoSolvePuzzle = useCallback(async () => {
    if (!state.currentPuzzle) {
      return;
    }

    const puzzleId = state.currentPuzzle.id; // Store puzzle ID to check for changes
    const puzzle = state.currentPuzzle;

    setIsAutoSolving(true);

    try {
      // Reset to initial position
      chessInstance.load(puzzle.fen);
      setCurrentPosition(puzzle.fen);
      setCurrentMoveIndex(0);

      // Play through each move with delay
      for (let i = 0; i < puzzle.solutionMovesUCI.length; i++) {
        // Check if puzzle has changed during auto-solve
        if (!state.currentPuzzle || state.currentPuzzle.id !== puzzleId) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, AUTO_SOLVE_MOVE_DELAY));

        // Check again after delay
        if (!state.currentPuzzle || state.currentPuzzle.id !== puzzleId) {
          break;
        }

        const { from, to, promotion } = extractMoveComponents(puzzle.solutionMovesUCI[i]);
        await makeMove(from, to, promotion);
        setCurrentMoveIndex(i + 1);
      }

      // Only proceed with delay if puzzle hasn't changed
      if (state.currentPuzzle && state.currentPuzzle.id === puzzleId) {
        await new Promise(resolve => setTimeout(resolve, NEXT_PUZZLE_DELAY));
      }
    } catch (error) {
      console.error(`Error during auto-solve:`, error);
    } finally {
      setIsAutoSolving(false);

      // Only call onPuzzleComplete if the puzzle hasn't changed
      if (state.currentPuzzle && state.currentPuzzle.id === puzzleId) {
        onPuzzleComplete();
      }
    }
  }, [state.currentPuzzle, chessInstance, makeMove, onPuzzleComplete]);

  const handlePuzzleSuccess = useCallback(async () => {
    console.log('Puzzle Success:', {
      puzzleId: state.currentPuzzle?.id,
      currentFen: chessInstance.fen(),
      moveIndex: currentMoveIndex
    });
    
    if (!state.currentPuzzle) {
      return;
    }

    // Record the successful puzzle attempt
    dispatch({
      type: 'RECORD_SUCCESSFUL_PUZZLE',
      payload: {
        id: state.currentPuzzle.id,
        theme: state.currentPuzzle.theme || 'Uncategorized'
      }
    });

    try {
      // Save session after recording success
      await AsyncStorage.setItem('@chess_woodpecker/session', JSON.stringify(state.session));
      console.log('Session saved after successful puzzle');
    } catch (error) {
      console.error('Failed to save session after successful puzzle:', error);
    }

    // Complete the puzzle
    onPuzzleComplete();
  }, [onPuzzleComplete, state.currentPuzzle, state.session, dispatch]);

  const handlePuzzleFailure = useCallback(async () => {
    if (!state.currentPuzzle) {
      return;
    }

    console.log('Puzzle Failure:', {
      puzzleId: state.currentPuzzle?.id,
      currentFen: chessInstance.fen(),
      moveIndex: currentMoveIndex
    });

    // Play failure sound and heavy haptic feedback
    await Promise.all([
      playSound(SoundTypes.FAILURE),
      triggerHaptic('heavy')
    ]);

    // Record the failed puzzle attempt
    dispatch({
      type: 'RECORD_FAILED_PUZZLE',
      payload: {
        id: state.currentPuzzle.id,
        theme: state.currentPuzzle.theme || 'Uncategorized'
      }
    });

    // Reset to initial position
    const puzzle = state.currentPuzzle;
    chessInstance.load(puzzle.fen);
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);

    // Auto-solve to show correct solution
    setIsAutoSolving(true);

    try {
      // Play through each move with delay
      for (const move of puzzle.solutionMovesUCI) {
        await new Promise(resolve => setTimeout(resolve, AUTO_SOLVE_MOVE_DELAY));
        const { from, to, promotion } = extractMoveComponents(move);
        await makeMove(from, to, promotion);
      }

      // Wait before loading next puzzle
      await new Promise(resolve => setTimeout(resolve, NEXT_PUZZLE_DELAY));
    } catch (error) {
      console.error('Error during auto-solve after failure:', error);
    } finally {
      setIsAutoSolving(false);
      onPuzzleComplete(); // Move to next puzzle
    }
  }, [state.currentPuzzle, chessInstance, makeMove, dispatch, onPuzzleComplete, currentMoveIndex]);

  const handleMove = useCallback(async (from: string, to: string) => {
    console.log('Move Attempt:', {
      from,
      to,
      isAutoSolving,
      isOpponentMoving,
      currentFen: chessInstance.fen(),
      expectedFen: state.currentPuzzle?.fen,
      moveIndex: currentMoveIndex
    });

    if (!state.currentPuzzle || isAutoSolving || isOpponentMoving) {
      console.log('Move rejected - state check:', {
        hasPuzzle: !!state.currentPuzzle,
        isAutoSolving,
        isOpponentMoving
      });
      return;
    }

    const puzzle = state.currentPuzzle;

    // Debug the current state
    console.log('Attempting move:', {
      from,
      to,
      currentMoveIndex,
      currentFen: chessInstance.fen()
    });

    // Load current position and replay moves
    if (!replayMoves(chessInstance, puzzle.fen, puzzle.solutionMovesUCI.slice(0, currentMoveIndex))) {
      console.error('Failed to replay moves to current position', {
        puzzleFen: puzzle.fen,
        previousMoves: puzzle.solutionMovesUCI.slice(0, currentMoveIndex)
      });
      return;
    }

    // Validate the move
    const shouldPromote = isPromotionMove(chessInstance, from, to);
    const result = validatePuzzleMove(
      chessInstance,
      { from, to, promotion: shouldPromote ? 'q' : undefined },
      puzzle.solutionMovesUCI,
      currentMoveIndex
    );

    console.log('Move validation result:', {
      isValid: result.isValid,
      isComplete: result.isComplete,
      expectedMove: puzzle.solutionMovesUCI[currentMoveIndex]
    });

    if (!result.isValid) {
      console.log('Invalid move:', {
        attempted: { from, to },
        expected: puzzle.solutionMovesUCI[currentMoveIndex]
      });
      await handlePuzzleFailure();
      return;
    }

    // Make the user's move
    const moveSuccess = await makeMove(from, to, shouldPromote ? 'q' : undefined);
    if (!moveSuccess) {
      console.error('Failed to make move despite validation passing');
      return;
    }

    const newMoveIndex = currentMoveIndex + 1;
    setCurrentMoveIndex(newMoveIndex);

    if (result.isComplete) {
      playSound('success');
      handlePuzzleSuccess();
    } else {
      // Make opponent's move after a short delay
      setIsOpponentMoving(true);
      await new Promise(resolve => setTimeout(resolve, OPPONENT_MOVE_DELAY));

      // Get the next move using the updated move index
      const { from: oppFrom, to: oppTo, promotion: oppPromotion } = 
        extractMoveComponents(puzzle.solutionMovesUCI[newMoveIndex]);

      await makeMove(oppFrom, oppTo, oppPromotion);
      setCurrentMoveIndex(newMoveIndex + 1);
      setIsOpponentMoving(false);
    }
  }, [
    state.currentPuzzle,
    isAutoSolving,
    isOpponentMoving,
    currentMoveIndex,
    chessInstance,
    makeMove,
    handlePuzzleSuccess,
    handlePuzzleFailure
  ]);

  const isUserTurn = useCallback(() => {
    if (!state.currentPuzzle) return false;
    if (currentMoveIndex === 0) return true;
    return (currentMoveIndex % 2 === 0) === state.currentPuzzle.isWhiteToMove;
  }, [currentMoveIndex, state.currentPuzzle]);

  const isGameOver = useCallback(() => {
    if (!state.currentPuzzle) return false;
    return currentMoveIndex >= state.currentPuzzle.solutionMovesUCI.length;
  }, [currentMoveIndex, state.currentPuzzle]);

  return {
    currentPosition,
    currentMoveIndex,
    handleMove,
    resetGame,
    onPuzzleComplete,
    isOpponentMoving,
    makeOpponentMove: async () => {}, // Keep for interface compatibility but no longer used
    autoSolvePuzzle,
    isUserTurn: isUserTurn(),
    isGameOver: isGameOver(),
    isAutoSolving,
  };
}
