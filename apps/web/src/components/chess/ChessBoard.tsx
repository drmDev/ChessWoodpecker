import React, { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { loadSounds, playSound, unloadSounds } from '../../utils/sounds';

const ChessBoard: React.FC = () => {
  // Initialize the game with a proper constructor
  const [game, setGame] = useState<Chess>(new Chess());
  // Then use the game instance to get the FEN
  const [position, setPosition] = useState<string>(game.fen());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load sounds on mount
  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  // Clear error message after 2 seconds
  const clearError = useCallback(() => {
    setTimeout(() => {
      setErrorMessage(null);
    }, 2000);
  }, []);

  const makeMove = (from: string, to: string) => {
    try {
      const newGame = new Chess(game.fen());
      
      // Check if it's trying to move opponent's piece
      const piece = game.get(from as Square);
      if (!piece) {
        setErrorMessage('No piece at selected position');
        playSound('failure');
        clearError();
        return false;
      }
      
      if ((game.turn() === 'w' && piece.color === 'b') || 
          (game.turn() === 'b' && piece.color === 'w')) {
        setErrorMessage("Can't move opponent's pieces");
        playSound('failure');
        clearError();
        return false;
      }

      const move = newGame.move({
        from: from as Square,
        to: to as Square,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move) {
        setGame(newGame);
        setPosition(newGame.fen());
        
        // Play appropriate sound
        if (move.captured) {
          playSound('capture');
        } else if (move.san.includes('+')) {
          playSound('check');
        } else {
          playSound('move');
        }
        
        return true;
      }

      setErrorMessage('Invalid move');
      playSound('failure');
      clearError();
      return false;
    } catch (e) {
      setErrorMessage('Invalid move');
      playSound('failure');
      clearError();
      return false;
    }
  };

  return (
    <div>
      <Chessboard
        position={position}
        onPieceDrop={makeMove}
        boardWidth={600}
        areArrowsAllowed={true}
        showBoardNotation={true}
      />
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ChessBoard; 