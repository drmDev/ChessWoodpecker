import React from 'react';
import { render, screen } from '@testing-library/react';
import ChessBoard from '../ChessBoard';
import { loadSounds, playSound, unloadSounds } from '../../../utils/sounds';

// Mock the sounds utility
jest.mock('../../../utils/sounds', () => ({
  loadSounds: jest.fn(),
  playSound: jest.fn(),
  unloadSounds: jest.fn(),
}));

// Mock the chess.js library
jest.mock('chess.js', () => {
  const mockFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  class MockChess {
    private currentFen: string;
    
    constructor(fen?: string) {
      this.currentFen = fen || mockFen;
    }
    
    fen(): string {
      return this.currentFen;
    }
  }
  
  return {
    Chess: MockChess,
    Square: {
      A1: 'a1', B1: 'b1', C1: 'c1', D1: 'd1', E1: 'e1', F1: 'f1', G1: 'g1', H1: 'h1',
      A2: 'a2', B2: 'b2', C2: 'c2', D2: 'd2', E2: 'e2', F2: 'f2', G2: 'g2', H2: 'h2',
      A3: 'a3', B3: 'b3', C3: 'c3', D3: 'd3', E3: 'e3', F3: 'f3', G3: 'g3', H3: 'h3',
      A4: 'a4', B4: 'b4', C4: 'c4', D4: 'd4', E4: 'e4', F4: 'f4', G4: 'g4', H4: 'h4',
      A5: 'a5', B5: 'b5', C5: 'c5', D5: 'd5', E5: 'e5', F5: 'f5', G5: 'g5', H5: 'h5',
      A6: 'a6', B6: 'b6', C6: 'c6', D6: 'd6', E6: 'e6', F6: 'f6', G6: 'g6', H6: 'h6',
      A7: 'a7', B7: 'b7', C7: 'c7', D7: 'd7', E7: 'e7', F7: 'f7', G7: 'g7', H7: 'h7',
      A8: 'a8', B8: 'b8', C8: 'c8', D8: 'd8', E8: 'e8', F8: 'f8', G8: 'g8', H8: 'h8'
    }
  };
});

// Mock the react-chessboard component
jest.mock('react-chessboard', () => ({
  Chessboard: () => <div data-testid="chessboard" />
}));

describe('ChessBoard Component', () => {
  test('renders the chessboard', () => {
    render(<ChessBoard />);
    expect(screen.getByTestId('chessboard')).toBeInTheDocument();
  });
  
  test('loads sounds on mount and unloads on unmount', () => {
    const { unmount } = render(<ChessBoard />);
    expect(loadSounds).toHaveBeenCalled();
    
    unmount();
    expect(unloadSounds).toHaveBeenCalled();
  });
}); 