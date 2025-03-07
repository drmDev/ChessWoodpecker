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
    console.log('[usePuzzleGame] Initializing new Chess instance');
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
      console.log('[usePuzzleGame] Loading new puzzle:', {
        id: puzzle.id,
        fen: puzzle.fen
      });
      
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
      
      console.log('[usePuzzleGame] Game state:', {
        status: 'active',
        position: newState.position,
        moveIndex: newState.moveIndex,
        isUserTurn: true,
        isGameOver: false,
        isAutoSolving: newState.isAutoSolving,
        isOpponentMoving: newState.isOpponentMoving
      });
    } else {
      console.log('[usePuzzleGame] Session ended or no active puzzle, resetting state');
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
      
      console.log('[usePuzzleGame] Game state:', {
        status: 'inactive',
        position: 'no position',
        moveIndex: newState.moveIndex,
        isUserTurn: false,
        isGameOver: false,
        isAutoSolving: newState.isAutoSolving,
        isOpponentMoving: newState.isOpponentMoving
      });
    }
  }, [state.currentPuzzle]);

  // Log state changes in a more descriptive way
  useEffect(() => {
    // Only log state changes after initial setup
    if (currentPosition === state.currentPuzzle?.fen || (!state.currentPuzzle && currentPosition === null)) {
      const puzzle = state.currentPuzzle;
      const status = puzzle ? 'active' : 'inactive';
      const position = currentPosition || 'no position';
      
      console.log('[usePuzzleGame] Game state:', {
        status,
        position,
        moveIndex: currentMoveIndex,
        isUserTurn: isUserTurn(),
        isGameOver: isGameOver(),
        isAutoSolving,
        isOpponentMoving
      });
    }
  }, [currentPosition, currentMoveIndex, isOpponentMoving, isAutoSolving, state.currentPuzzle]);

  const resetGame = useCallback((puzzle: Puzzle) => {
    console.log('[usePuzzleGame] Resetting game with puzzle:', {
      id: puzzle.id,
      fen: puzzle.fen
    });
    
    chessInstance.load(puzzle.fen);
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    setIsOpponentMoving(false);
    setIsAutoSolving(false);
    
    console.log('[usePuzzleGame] Game reset complete, new position:', chessInstance.fen());
  }, [chessInstance]);

  const makeMove = useCallback(async (from: string, to: string, promotion?: string) => {
    console.log('[usePuzzleGame] Making move:', { from, to, promotion, currentPosition: chessInstance.fen() });
    const moveResult = chessInstance.move({ from, to, promotion });
    if (!moveResult) return false;

    // Play appropriate sound based on the move type
    const moveType = getMoveType(chessInstance, moveResult);
    await playSound(moveType);

    setCurrentPosition(chessInstance.fen());
    return true;
  }, [chessInstance]);

  const autoSolvePuzzle = useCallback(async () => {
    if (!state.currentPuzzle) return;

    const puzzle = state.currentPuzzle;
    setIsAutoSolving(true);

    try {
      // Reset to initial position
      chessInstance.load(puzzle.fen);
      setCurrentPosition(puzzle.fen);
      setCurrentMoveIndex(0);

      // Play through each move with delay
      for (let i = 0; i < puzzle.solutionMovesUCI.length; i++) {
        await new Promise(resolve => setTimeout(resolve, AUTO_SOLVE_MOVE_DELAY));
        const { from, to, promotion } = extractMoveComponents(puzzle.solutionMovesUCI[i]);
        await makeMove(from, to, promotion);
        setCurrentMoveIndex(i + 1);
      }

      await new Promise(resolve => setTimeout(resolve, NEXT_PUZZLE_DELAY));
    } finally {
      setIsAutoSolving(false);
      onPuzzleComplete();
    }
  }, [state.currentPuzzle, chessInstance, makeMove, onPuzzleComplete]);

  const handleMove = useCallback(async (from: string, to: string) => {
    if (!state.currentPuzzle || isAutoSolving || isOpponentMoving) return;

    const puzzle = state.currentPuzzle;
    
    // Load current position and replay moves
    if (!replayMoves(chessInstance, puzzle.fen, puzzle.solutionMovesUCI.slice(0, currentMoveIndex))) {
      console.error('Failed to replay moves');
      return;
    }

    // Validate the move
    const shouldPromote = isPromotionMove(chessInstance, from, to);
    const moveToValidate = shouldPromote ? `${to}q` : to;

    const result = validatePuzzleMove(
      chessInstance,
      { from, to: moveToValidate },
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
        dispatch({ 
          type: 'RECORD_PUZZLE_ATTEMPT', 
          payload: { 
            puzzle: state.currentPuzzle,
            success: true 
          }
        });
        onPuzzleComplete();
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
      // Record failed attempt before auto-solving
      dispatch({ 
        type: 'RECORD_PUZZLE_ATTEMPT', 
        payload: { 
          puzzle: state.currentPuzzle,
          success: false 
        }
      });
      autoSolvePuzzle();
    }
  }, [state.currentPuzzle, currentMoveIndex, makeMove, isAutoSolving, isOpponentMoving, autoSolvePuzzle, onPuzzleComplete, dispatch]);

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