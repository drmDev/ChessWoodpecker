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
export function usePuzzleGame(onPuzzleComplete: () => void): PuzzleGameState & PuzzleGameActions {
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
    if (!moveResult) return false;

    // Play appropriate sound based on the move type
    const moveType = getMoveType(chessInstance, moveResult);
    await playSound(moveType);

    setCurrentPosition(chessInstance.fen());
    return true;
  }, [chessInstance]);

  const autoSolvePuzzle = useCallback(async () => {
    if (!state.currentPuzzle) {
      console.log(`[usePuzzleGame] Cannot auto-solve: no current puzzle`);
      return;
    }

    const puzzleId = state.currentPuzzle.id; // Store puzzle ID to check for changes
    const puzzle = state.currentPuzzle;

    console.log(`[usePuzzleGame] Starting auto-solve for puzzle ${puzzle.id}`, {
      totalMoves: puzzle.solutionMovesUCI.length
    });

    setIsAutoSolving(true);

    try {
      // Reset to initial position
      chessInstance.load(puzzle.fen);
      setCurrentPosition(puzzle.fen);
      setCurrentMoveIndex(0);

      console.log(`[usePuzzleGame] Reset to initial position for auto-solve`);

      // Play through each move with delay
      for (let i = 0; i < puzzle.solutionMovesUCI.length; i++) {
        // Check if puzzle has changed during auto-solve
        if (!state.currentPuzzle || state.currentPuzzle.id !== puzzleId) {
          console.log(`[usePuzzleGame] Auto-solve aborted: puzzle changed`);
          break;
        }

        console.log(`[usePuzzleGame] Auto-solve move ${i + 1}/${puzzle.solutionMovesUCI.length}`, {
          move: puzzle.solutionMovesUCI[i]
        });

        await new Promise(resolve => setTimeout(resolve, AUTO_SOLVE_MOVE_DELAY));

        // Check again after delay
        if (!state.currentPuzzle || state.currentPuzzle.id !== puzzleId) {
          console.log(`[usePuzzleGame] Auto-solve aborted after delay: puzzle changed`);
          break;
        }

        const { from, to, promotion } = extractMoveComponents(puzzle.solutionMovesUCI[i]);
        await makeMove(from, to, promotion);
        setCurrentMoveIndex(i + 1);

        console.log(`[usePuzzleGame] Auto-solve move ${i + 1} completed`);
      }

      // Only proceed with delay if puzzle hasn't changed
      if (state.currentPuzzle && state.currentPuzzle.id === puzzleId) {
        console.log(`[usePuzzleGame] Auto-solve completed, waiting before loading next puzzle`);
        await new Promise(resolve => setTimeout(resolve, NEXT_PUZZLE_DELAY));
        console.log(`[usePuzzleGame] Auto-solve delay completed, ready for next puzzle`);
      }
    } catch (error) {
      console.error(`[usePuzzleGame] Error during auto-solve:`, error);
    } finally {
      setIsAutoSolving(false);

      console.log(`[usePuzzleGame] Auto-solve process finished, calling onPuzzleComplete`);

      // Only call onPuzzleComplete if the puzzle hasn't changed
      if (state.currentPuzzle && state.currentPuzzle.id === puzzleId) {
        onPuzzleComplete();
      } else {
        console.log(`[usePuzzleGame] Skipped onPuzzleComplete call because puzzle changed`);
      }
    }
  }, [state.currentPuzzle, chessInstance, makeMove, onPuzzleComplete]);
  
  const handlePuzzleSuccess = useCallback(() => {
    if (!state.currentPuzzle) return;

    // We don't need to track successful puzzles in our simplified approach
    // but we'll keep this function for symmetry and potential future use

    onPuzzleComplete();
  }, [onPuzzleComplete, state.currentPuzzle]);

  // CHANGE: Remove onPuzzleComplete call from handlePuzzleFailure
  const handlePuzzleFailure = useCallback(() => {
    if (!state.currentPuzzle) {
      console.log(`[usePuzzleGame] Cannot record failure: no current puzzle`);
      return;
    }

    console.log(`[usePuzzleGame] Recording failed puzzle attempt`, {
      puzzleId: state.currentPuzzle.id,
      theme: state.currentPuzzle.theme || 'Uncategorized'
    });

    dispatch({
      type: 'RECORD_FAILED_PUZZLE',
      payload: {
        id: state.currentPuzzle.id,
        theme: state.currentPuzzle.theme || 'Uncategorized'
      }
    });

    console.log(`[usePuzzleGame] Puzzle failure recorded`);
  }, [dispatch, state.currentPuzzle]);

  const handleMove = useCallback(async (from: string, to: string) => {
    if (!state.currentPuzzle || isAutoSolving || isOpponentMoving) return;

    console.log(`[usePuzzleGame] Processing move from ${from} to ${to}`, {
      puzzleId: state.currentPuzzle.id,
      currentMoveIndex,
      isAutoSolving,
      isOpponentMoving
    });

    const puzzle = state.currentPuzzle;

    // Load current position and replay moves
    if (!replayMoves(chessInstance, puzzle.fen, puzzle.solutionMovesUCI.slice(0, currentMoveIndex))) {
      console.error(`[usePuzzleGame] Failed to replay moves to current position`);
      return;
    }

    // Validate the move
    const shouldPromote = isPromotionMove(chessInstance, from, to);
    const moveToValidate = shouldPromote ? `${to}q` : to;

    console.log(`[usePuzzleGame] Validating move`, {
      from,
      to,
      shouldPromote,
      moveToValidate,
      currentMoveIndex,
      expectedMove: puzzle.solutionMovesUCI[currentMoveIndex]
    });

    const result = validatePuzzleMove(
      chessInstance,
      { from, to: moveToValidate },
      puzzle.solutionMovesUCI,
      currentMoveIndex
    );

    if (result.isValid) {
      console.log(`[usePuzzleGame] Move is valid`, {
        isComplete: result.isComplete,
        newMoveIndex: currentMoveIndex + 1
      });

      // Make the user's move
      await makeMove(from, to, shouldPromote ? 'q' : undefined);
      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (result.isComplete) {
        console.log(`[usePuzzleGame] Puzzle completed successfully`);
        playSound('success');
        // Record successful attempt before completing
        handlePuzzleSuccess();
      } else {
        console.log(`[usePuzzleGame] Preparing opponent's move`);

        // Make opponent's move after a short delay
        setIsOpponentMoving(true);
        await new Promise(resolve => setTimeout(resolve, OPPONENT_MOVE_DELAY));

        // Get the next move using the updated move index
        const { from: oppFrom, to: oppTo, promotion: oppPromotion } = extractMoveComponents(puzzle.solutionMovesUCI[newMoveIndex]);

        console.log(`[usePuzzleGame] Making opponent move`, {
          from: oppFrom,
          to: oppTo,
          promotion: oppPromotion
        });

        await makeMove(oppFrom, oppTo, oppPromotion);
        setCurrentMoveIndex(newMoveIndex + 1);
        setIsOpponentMoving(false);

        console.log(`[usePuzzleGame] Opponent move completed`);
      }
    } else {
      console.log(`[usePuzzleGame] Move is invalid, starting auto-solve sequence`);

      playSound('failure');

      // First record the failure
      handlePuzzleFailure();

      // Then start auto-solve (which will call onPuzzleComplete when done)
      console.log(`[usePuzzleGame] Beginning auto-solve process`);

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