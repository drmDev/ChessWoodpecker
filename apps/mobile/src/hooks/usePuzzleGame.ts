import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { validatePuzzleMove } from '../utils/chess/PuzzleMoveValidator';
import { playSound } from '../utils/sounds';
import { useAppState } from '../contexts/AppStateContext';
import { Puzzle } from '../models/PuzzleModel';
import { extractMoveComponents, isPromotionMove, replayMoves, getMoveType } from '../utils/chess/PuzzleLogic';

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
    chessInstance.load(puzzle.fen);
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    setIsOpponentMoving(false);
    setIsAutoSolving(false);
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

  const handlePuzzleSuccess = useCallback(() => {
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

    // Complete the puzzle
    onPuzzleComplete();
  }, [onPuzzleComplete, state.currentPuzzle, dispatch]);

  const handlePuzzleFailure = useCallback(() => {
    if (!state.currentPuzzle) {
      return;
    }

    // Record the failed puzzle attempt
    dispatch({
      type: 'RECORD_FAILED_PUZZLE',
      payload: {
        id: state.currentPuzzle.id,
        theme: state.currentPuzzle.theme || 'Uncategorized'
      }
    });
  }, [state.currentPuzzle, dispatch]);

  const handleMove = useCallback(async (from: string, to: string) => {
    if (!state.currentPuzzle || isAutoSolving || isOpponentMoving) return;

    const puzzle = state.currentPuzzle;

    // Load current position and replay moves
    if (!replayMoves(chessInstance, puzzle.fen, puzzle.solutionMovesUCI.slice(0, currentMoveIndex))) {
      console.error(`Failed to replay moves to current position`);
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

    if (result.isValid) {
      // Make the user's move
      await makeMove(from, to, shouldPromote ? 'q' : undefined);
      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (result.isComplete) {
        playSound('success');
        // Record successful attempt before completing
        handlePuzzleSuccess();
      } else {
        // Make opponent's move after a short delay
        setIsOpponentMoving(true);
        await new Promise(resolve => setTimeout(resolve, OPPONENT_MOVE_DELAY));

        // Get the next move using the updated move index
        const { from: oppFrom, to: oppTo, promotion: oppPromotion } = extractMoveComponents(puzzle.solutionMovesUCI[newMoveIndex]);

        await makeMove(oppFrom, oppTo, oppPromotion);
        setCurrentMoveIndex(newMoveIndex + 1);
        setIsOpponentMoving(false);
      }
    } else {
      playSound('failure');

      // First record the failure
      handlePuzzleFailure();

      // Then start auto-solve (which will call onPuzzleComplete when done)
      autoSolvePuzzle();
    }
  }, [state.currentPuzzle, currentMoveIndex, makeMove, isAutoSolving, isOpponentMoving, autoSolvePuzzle, handlePuzzleSuccess, handlePuzzleFailure]);

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