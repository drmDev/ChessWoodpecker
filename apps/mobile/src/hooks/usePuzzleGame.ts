import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { validatePuzzleMove, UserMove } from '../utils/chess/PuzzleMoveValidator';
import { playSound, SoundTypes } from '../utils/sounds';
import { PuzzleSetupState, PuzzleTransitionState, useAppState } from '../contexts/AppStateContext';
import { Puzzle } from '../models/PuzzleModel';
import { extractMoveComponents, isPromotionMove, getMoveType } from '../utils/chess/PuzzleLogic';
import { triggerHaptic } from '../utils/haptics';

interface PuzzleGameState {
  currentPosition: string | null;
  currentMoveIndex: number;
  isOpponentMoving: boolean;
  lastMoveFrom: string | null;
  lastMoveTo: string | null;
  isUserTurn: boolean;
  isGameOver: boolean;
  isAutoSolving: boolean;
  puzzleSetupState: PuzzleSetupState;
}

interface PuzzleGameActions {
  handleMove: (from: string, to: string, promotion?: string) => Promise<void>;
  resetGame: (puzzle: Puzzle) => void;
  makeOpponentMove: (moveIndex: number) => Promise<void>;
  autoSolvePuzzle: () => Promise<void>;
}

const AUTO_SOLVE_MOVE_DELAY = 1000;
const NEXT_PUZZLE_DELAY = 2000;
const OPPONENT_MOVE_DELAY = 500;
const PUZZLE_SETUP_BUFFER = 200;

export function usePuzzleGame(
  onPuzzleComplete: () => void
): PuzzleGameState & PuzzleGameActions {
  const { state, dispatch } = useAppState();
  const [chessInstance] = useState(() => new Chess());
  
  // State management
  const [currentPosition, setCurrentPosition] = useState<string | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);
  const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);

  // Helper function to manage transition states
  const setTransitionState = useCallback((newState: PuzzleTransitionState) => {
    dispatch({ type: 'SET_PUZZLE_TRANSITION_STATE', payload: newState });
  }, [dispatch]);

  // Add setup state management
  const setPuzzleSetupState = useCallback((newState: PuzzleSetupState) => {
    dispatch({ type: 'SET_PUZZLE_SETUP_STATE', payload: newState });
  }, [dispatch]);

  // Simplify the reset game effect to focus only on puzzle mechanics
  useEffect(() => {
    const puzzle = state.currentPuzzle;
    if (puzzle) {
      // Start setup process
      setPuzzleSetupState('PRE_SETUP');
      
      const setupPuzzle = async () => {
        try {
          setPuzzleSetupState('SETUP_IN_PROGRESS');
          
          // Reset chess instance
          chessInstance.load(puzzle.fen);
          setCurrentPosition(puzzle.fen);
          
          // Reset all game states
          setCurrentMoveIndex(0);
          setIsOpponentMoving(false);
          setIsAutoSolving(false);
          setLastMoveFrom(null);
          setLastMoveTo(null);
          setIsUserTurn(true);
          setIsGameOver(false);
          
          // Add artificial delay for smooth transition
          await new Promise(resolve => setTimeout(resolve, PUZZLE_SETUP_BUFFER));
          
          // Setup complete
          setPuzzleSetupState('SETUP_COMPLETE');
        } catch (error) {
          console.error('Error during puzzle setup:', error);
          setPuzzleSetupState('PRE_SETUP');
        }
      };
      
      setupPuzzle();
    } else {
      // Reset state when no puzzle is active
      setPuzzleSetupState('PRE_SETUP');
      chessInstance.reset();
      setCurrentPosition(null);
    }
  }, [state.currentPuzzle, chessInstance, setPuzzleSetupState]);

  const makeMove = useCallback(async (from: string, to: string, promotion?: string): Promise<boolean> => {
    const moveResult = chessInstance.move({ from, to, promotion });
    if (!moveResult) {
      return false;
    }

    const moveType = getMoveType(chessInstance, moveResult);
    await playSound(moveType);

    setCurrentPosition(chessInstance.fen());
    setLastMoveFrom(from);
    setLastMoveTo(to);
    return true;
  }, [chessInstance]);

  const makeOpponentMove = useCallback(async (moveIndex: number) => {
    console.log('makeOpponentMove called:', {
      hasPuzzle: !!state.currentPuzzle,
      moveIndex,
      solutionMoves: state.currentPuzzle?.solutionMovesUCI,
      isOpponentMoving,
      isUserTurn
    });

    if (!state.currentPuzzle || moveIndex >= state.currentPuzzle.solutionMovesUCI.length) {
      console.log('Cannot make opponent move - invalid state');
      setIsUserTurn(true);
      setIsOpponentMoving(false);
      return;
    }

    setIsOpponentMoving(true);
    setIsUserTurn(false);

    try {
      await new Promise(resolve => setTimeout(resolve, OPPONENT_MOVE_DELAY));
      
      const move = state.currentPuzzle.solutionMovesUCI[moveIndex];
      console.log('Opponent making move:', move, {moveIndex});
      
      const { from, to, promotion } = extractMoveComponents(move);
      
      const moveSuccess = await makeMove(from, to, promotion);
      console.log('Opponent move result:', { moveSuccess, move });

      if (moveSuccess) {
        setCurrentMoveIndex(moveIndex + 1);
      } else {
        console.error('Opponent move failed:', move);
      }
    } catch (error) {
      console.error('Error in makeOpponentMove:', error);
    } finally {
      setIsOpponentMoving(false);
      setIsUserTurn(true);
      console.log('Opponent move completed, states reset');
    }
  }, [state.currentPuzzle, makeMove]);

  const handleMove = useCallback(async (from: string, to: string, promotion?: string) => {
    console.log('handleMove called with:', { 
      from, 
      to, 
      promotion,
      isOpponentMoving,
      isUserTurn,
      currentMoveIndex
    });
    
    if (!state.currentPuzzle || isOpponentMoving || isAutoSolving || !isUserTurn) {
      return;
    }

    // Check if this move requires promotion
    const needsPromotion = isPromotionMove(chessInstance, from, to);
    
    // For promotion moves, always assume queen promotion in puzzles
    // since that's typically the correct choice
    const effectivePromotion = needsPromotion ? (promotion || 'q') : undefined;
    
    const userMove: UserMove = {
      from,
      to,
      promotion: effectivePromotion
    };

    console.log('Validating move:', {
      userMove,
      currentMoveIndex,
      expectedMove: state.currentPuzzle.solutionMovesUCI[currentMoveIndex]
    });

    const validationResult = validatePuzzleMove(
      chessInstance,
      userMove,
      state.currentPuzzle.solutionMovesUCI,
      currentMoveIndex
    );

    if (validationResult.isValid) {
      console.log('Move is valid, executing...', {
        currentMoveIndex,
        totalMoves: state.currentPuzzle.solutionMovesUCI.length
      });
      
      await makeMove(from, to, effectivePromotion);
      const nextMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(nextMoveIndex);
      
      if (nextMoveIndex >= state.currentPuzzle.solutionMovesUCI.length) {
        console.log('Puzzle completed successfully');
        setIsGameOver(true);
        await handlePuzzleSuccess();
      } else {
        console.log('Initiating opponent move...', {
          nextMoveIndex,
          nextExpectedMove: state.currentPuzzle.solutionMovesUCI[nextMoveIndex]
        });
        setIsUserTurn(false);
        await makeOpponentMove(nextMoveIndex);
      }
    } else {
      console.log('Move is invalid, handling failure');
      await handlePuzzleFailure();
    }
  }, [
    state.currentPuzzle,
    isOpponentMoving,
    isAutoSolving,
    isUserTurn,
    currentMoveIndex,
    makeMove,
    makeOpponentMove,
    chessInstance
  ]);

  // Simplify resetGame to focus on puzzle mechanics
  const resetGame = useCallback((puzzle: Puzzle) => {
    setPuzzleSetupState('PRE_SETUP');
    chessInstance.load(puzzle.fen);
    setCurrentPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    setIsOpponentMoving(false);
    setIsAutoSolving(false);
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setIsUserTurn(true);
    setIsGameOver(false);
    setTransitionState('STABLE');
  }, [chessInstance, setTransitionState, setPuzzleSetupState]);

  const autoSolvePuzzle = useCallback(async () => {
    if (!state.currentPuzzle || isAutoSolving) return;

    setIsAutoSolving(true);
    setTransitionState('TRANSITIONING');

    try {
      const puzzle = state.currentPuzzle;
      chessInstance.load(puzzle.fen);
      setCurrentPosition(puzzle.fen);
      setCurrentMoveIndex(0);

      for (const move of puzzle.solutionMovesUCI) {
        await new Promise(resolve => setTimeout(resolve, AUTO_SOLVE_MOVE_DELAY));
        const { from, to, promotion } = extractMoveComponents(move);
        await makeMove(from, to, promotion);
      }

      await new Promise(resolve => setTimeout(resolve, NEXT_PUZZLE_DELAY));
      setTransitionState('LOADING');
      onPuzzleComplete();
    } finally {
      setIsAutoSolving(false);
    }
  }, [state.currentPuzzle, chessInstance, makeMove, onPuzzleComplete, setTransitionState]);

  // Simplify handlePuzzleSuccess to focus on core mechanics
  const handlePuzzleSuccess = useCallback(async () => {
    if (!state.currentPuzzle) return;

    setTransitionState('TRANSITIONING');

    try {
      await playSound(SoundTypes.SUCCESS);      
      setTransitionState('LOADING');
      onPuzzleComplete();
    } catch (error) {
      console.error('Error in puzzle success handling:', error);
      setTransitionState('STABLE');
    }
  }, [state.currentPuzzle, setTransitionState, onPuzzleComplete]);

  const handlePuzzleFailure = useCallback(async () => {
    if (!state.currentPuzzle) return;

    try {
      // Immediate feedback
      await Promise.all([
        playSound(SoundTypes.FAILURE),
        triggerHaptic('heavy')
      ]);

      // Show the incorrect move for a moment before resetting
      await new Promise(resolve => setTimeout(resolve, 800));

      // Visual indication we're resetting
      setTransitionState('RESETTING');
      
      // Reset to starting position with clear visual feedback
      chessInstance.load(state.currentPuzzle.fen);
      setCurrentPosition(state.currentPuzzle.fen);
      
      // Pause to let user see we've reset
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now start auto-solve with clear indication
      setTransitionState('AUTO_SOLVING');
      await autoSolvePuzzle();
    } catch (error) {
      console.error('Error in puzzle failure handling:', error);
      setTransitionState('STABLE');
    }
  }, [state.currentPuzzle, dispatch, autoSolvePuzzle, setTransitionState]);

  return {
    // State
    currentPosition,
    currentMoveIndex,
    isOpponentMoving,
    lastMoveFrom,
    lastMoveTo,
    isUserTurn,
    isGameOver,
    isAutoSolving,
    puzzleSetupState: state.puzzleSetupState,
    // Actions
    handleMove,
    resetGame,
    makeOpponentMove,
    autoSolvePuzzle,
  };
}
