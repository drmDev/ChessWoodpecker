import { useState, useCallback, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { validatePuzzleMove } from '../utils/chess/PuzzleMoveValidator';
import { playSound } from '../utils/sounds';
import { useAppState } from '../contexts/AppStateContext';
import { Puzzle } from '../models/PuzzleModel';

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
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<string | null>(null);
  const [chessInstance] = useState(() => new Chess());
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);

  // Reset game state when puzzle changes
  useEffect(() => {
    if (state.sessionData?.currentPuzzle) {
      resetGame(state.sessionData.currentPuzzle);
    }
  }, [state.sessionData?.currentPuzzle]);

  const resetGame = useCallback((puzzle: Puzzle) => {
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    setIsOpponentMoving(false);
    setIsAutoSolving(false);
    chessInstance.load(puzzle.fen);
  }, []);

  const makeMove = useCallback(async (from: string, to: string, promotion?: string) => {
    const moveResult = chessInstance.move({ from, to, promotion });
    if (!moveResult) return false;

    // Play appropriate sound based on the move type
    if (moveResult.captured) {
      await playSound('capture');
    } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
      await playSound('move');
    } else if (chessInstance.inCheck()) {
      await playSound('check');
    } else {
      await playSound('move');
    }

    setCurrentPosition(chessInstance.fen());
    return true;
  }, [chessInstance]);

  const autoSolvePuzzle = useCallback(async () => {
    if (!state.sessionData?.currentPuzzle) return;

    const puzzle = state.sessionData.currentPuzzle;
    setIsAutoSolving(true);

    try {
      // Reset to initial position
      chessInstance.load(puzzle.fen);
      setCurrentPosition(puzzle.fen);
      setCurrentMoveIndex(0);

      // Play through each move with delay
      for (let i = 0; i < puzzle.solutionMovesUCI.length; i++) {
        const move = puzzle.solutionMovesUCI[i];
        await new Promise(resolve => setTimeout(resolve, AUTO_SOLVE_MOVE_DELAY));

        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promotion = move.length === 5 ? move[4] : undefined;
        
        await makeMove(from, to, promotion);
        setCurrentMoveIndex(i + 1);
      }

      await new Promise(resolve => setTimeout(resolve, NEXT_PUZZLE_DELAY));
    } finally {
      setIsAutoSolving(false);
      onPuzzleComplete();
    }
  }, [state.sessionData?.currentPuzzle, chessInstance, makeMove, onPuzzleComplete]);

  const handleMove = useCallback(async (from: string, to: string) => {
    if (!state.sessionData?.currentPuzzle || isAutoSolving || isOpponentMoving) return;

    const puzzle = state.sessionData.currentPuzzle;
    
    // Load current position and replay moves
    chessInstance.load(puzzle.fen);
    for (let i = 0; i < currentMoveIndex; i++) {
      const move = puzzle.solutionMovesUCI[i];
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const promotion = move.length === 5 ? move[4] : undefined;
      chessInstance.move({ from, to, promotion });
    }

    // Validate the move
    const piece = chessInstance.get(from as Square);
    const isPromotion = piece && piece.type === 'p' && 
                        ((piece.color === 'w' && to[1] === '8') || 
                         (piece.color === 'b' && to[1] === '1'));

    const moveToValidate = isPromotion ? `${to}q` : to;

    const result = validatePuzzleMove(
      chessInstance,
      { from, to: moveToValidate },
      puzzle.solutionMovesUCI,
      currentMoveIndex
    );

    if (result.isValid) {
      // Make the user's move
      await makeMove(from, to, isPromotion ? 'q' : undefined);
      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);
      
      if (result.isComplete) {
        playSound('success');
        onPuzzleComplete();
      } else {
        // Make opponent's move after a short delay
        setIsOpponentMoving(true);
        await new Promise(resolve => setTimeout(resolve, OPPONENT_MOVE_DELAY));
        
        // Get the next move using the updated move index
        const nextMove = puzzle.solutionMovesUCI[newMoveIndex];
        const oppFrom = nextMove.substring(0, 2);
        const oppTo = nextMove.substring(2, 4);
        const oppPromotion = nextMove.length === 5 ? nextMove[4] : undefined;
        
        await makeMove(oppFrom, oppTo, oppPromotion);
        setCurrentMoveIndex(newMoveIndex + 1);
        setIsOpponentMoving(false);
      }
    } else {
      playSound('failure');
      autoSolvePuzzle();
    }
  }, [state.sessionData?.currentPuzzle, currentMoveIndex, makeMove, isAutoSolving, isOpponentMoving, autoSolvePuzzle, onPuzzleComplete]);

  const isUserTurn = useCallback(() => {
    if (!state.sessionData?.currentPuzzle) return false;
    if (currentMoveIndex === 0) return true;
    return (currentMoveIndex % 2 === 0) === state.sessionData.currentPuzzle.isWhiteToMove;
  }, [currentMoveIndex, state.sessionData?.currentPuzzle]);

  const isGameOver = useCallback(() => {
    if (!state.sessionData?.currentPuzzle) return false;
    return currentMoveIndex >= state.sessionData.currentPuzzle.solutionMovesUCI.length;
  }, [currentMoveIndex, state.sessionData?.currentPuzzle]);

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