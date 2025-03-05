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
}

interface PuzzleGameActions {
  handleMove: (from: string, to: string) => void;
  resetGame: (puzzle: Puzzle) => void;
  makeOpponentMove: () => Promise<void>;
}

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

  // Reset game state when puzzle changes
  useEffect(() => {
    if (state.sessionData?.currentPuzzle) {
      resetGame(state.sessionData.currentPuzzle);
    }
  }, [state.sessionData?.currentPuzzle]);

  const resetGame = useCallback((puzzle: Puzzle) => {
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    
    // Reset the chess instance to clear any highlighted squares
    chessInstance.load(puzzle.fen);
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
    const piece = chessInstance.get(from as Square);
    const isPromotion = piece && piece.type === 'p' && 
                        ((piece.color === 'w' && to[1] === '8') || 
                         (piece.color === 'b' && to[1] === '1')); // Check if it's a promotion move

    const moveToValidate = isPromotion ? `${to}q` : to; // Append 'q' for queen promotion if it's a promotion move

    const result = validatePuzzleMove(
      chessInstance,
      { from, to: moveToValidate }, // Validate with the correct notation
      puzzle.solutionMovesUCI,
      currentMoveIndex
    );

    if (result.isValid) {
      // Make the user's move
      const moveResult = chessInstance.move({ from, to, promotion: isPromotion ? 'q' : undefined }); // Handle promotion
      
      // Play appropriate sound based on the move type
      if (moveResult) {
        if (moveResult.captured) {
          playSound('capture');
        } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
          // Castle move
          playSound('move');
        } else if (chessInstance.inCheck()) {
          playSound('check');
        } else {
          playSound('move');
        }
      }
      
      setCurrentPosition(chessInstance.fen());
      setCurrentMoveIndex(prevIndex => prevIndex + 1);
      
      if (result.isComplete) {
        // Puzzle completed! Play success sound
        playSound('success');
        onPuzzleComplete();
      } else if (result.nextMove) {
        // Let the useEffect handle the opponent's move
        // The opponent's move will be made automatically by the makeOpponentMove function
      }
    } else {
      // Play failure sound
      playSound('failure');
      // TODO: Handle incorrect move
    }
  }, [state.sessionData?.currentPuzzle, currentMoveIndex, onPuzzleComplete]);

  const makeOpponentMove = useCallback(async () => {
    if (!chessInstance || !state.sessionData?.currentPuzzle || currentMoveIndex >= state.sessionData.currentPuzzle.solutionMovesUCI.length) {
      return;
    }

    const puzzle = state.sessionData.currentPuzzle;
    const move = puzzle.solutionMovesUCI[currentMoveIndex];
    setIsOpponentMoving(true);

    // Remove the delay before the opponent's move
    try {
      const moveResult = chessInstance.move(move);
      
      // Play appropriate sound based on the move type
      if (moveResult) {
        if (moveResult.captured) {
          await playSound('capture');
        } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
          // Castle move
          await playSound('move');
        } else if (chessInstance.inCheck()) {
          await playSound('check');
        } else {
          await playSound('move');
        }
      }

      setCurrentPosition(chessInstance.fen());
      setCurrentMoveIndex(prevIndex => prevIndex + 1);
    } catch (error) {
      console.error('Error making opponent move:', error);
    } finally {
      setIsOpponentMoving(false);
    }
  }, [chessInstance, currentMoveIndex, state.sessionData?.currentPuzzle, playSound]);

  // Compute derived state
  const isUserTurn = useCallback(() => {
    if (!state.sessionData?.currentPuzzle) return false;
    
    // In puzzles, the user always makes the first move
    // This is because puzzles are designed to start with the user's move
    if (currentMoveIndex === 0) {
      return true;
    }
    
    // For subsequent moves, alternate turns based on color
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
    makeOpponentMove,
    isUserTurn: isUserTurn(),
    isGameOver: isGameOver(),
  };
} 