import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { validatePuzzleMove } from '../utils/chess/PuzzleMoveValidator';
import { playSound } from '../utils/sounds';
import { useAppState } from '../contexts/AppStateContext';
import { Puzzle } from '../models/PuzzleModel';

interface PuzzleGameState {
  currentPosition: string | null;
  currentMoveIndex: number;
}

interface PuzzleGameActions {
  handleMove: (from: string, to: string) => void;
  resetGame: (puzzle: Puzzle) => void;
}

/**
 * Custom hook that manages the puzzle game state and logic
 * Handles move validation, execution, and progression through the puzzle
 */
export function usePuzzleGame(): PuzzleGameState & PuzzleGameActions {
  const { state, dispatch } = useAppState();
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<string | null>(null);
  const [chessInstance] = useState(() => new Chess());

  // Reset game state when puzzle changes
  useEffect(() => {
    if (state.sessionData?.currentPuzzle) {
      resetGame(state.sessionData.currentPuzzle);
    }
  }, [state.sessionData?.currentPuzzle]);

  const resetGame = useCallback((puzzle: Puzzle) => {
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
  }, []);

  const handleMove = useCallback((from: string, to: string) => {
    if (!state.sessionData?.currentPuzzle) return;

    const puzzle = state.sessionData.currentPuzzle;
    
    // Load current position
    chessInstance.load(puzzle.fen);
    
    // Play moves up to current index
    for (let i = 0; i < currentMoveIndex; i++) {
      const move = puzzle.solutionMovesUCI[i];
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const promotion = move.length === 5 ? move[4] : undefined;
      chessInstance.move({ from, to, promotion });
    }

    // Validate the move
    const result = validatePuzzleMove(
      chessInstance,
      { from, to },
      puzzle.solutionMovesUCI,
      currentMoveIndex
    );

    if (result.isValid) {
      // Make the user's move
      chessInstance.move({ from, to });
      setCurrentPosition(chessInstance.fen());
      
      if (result.isComplete) {
        // Puzzle completed! Play success sound
        playSound('success');
        // TODO: Handle puzzle completion
      } else if (result.nextMove) {
        const nextMove = result.nextMove; // Store in variable to satisfy type checker
        // Delay opponent's move by 500ms
        setTimeout(() => {
          // Make opponent's move
          const nextFrom = nextMove.substring(0, 2);
          const nextTo = nextMove.substring(2, 4);
          const nextPromotion = nextMove.length === 5 ? nextMove[4] : undefined;
          chessInstance.move({ from: nextFrom, to: nextTo, promotion: nextPromotion });
          
          // Update position and move index
          setCurrentPosition(chessInstance.fen());
          setCurrentMoveIndex(currentMoveIndex + 2);
        }, 500);
      }
    } else {
      // Play failure sound
      playSound('failure');
      // TODO: Handle incorrect move
    }
  }, [state.sessionData?.currentPuzzle, currentMoveIndex]);

  return {
    currentPosition,
    currentMoveIndex,
    handleMove,
    resetGame,
  };
} 