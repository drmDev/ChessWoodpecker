import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { OrientableChessBoard } from '../components/chess/OrientableChessBoard';
import * as boardOrientation from '../utils/boardOrientation';
import { getPuzzlePosition } from '../models/PuzzleModel';

// Mock the react-native-chessboard module
jest.mock('react-native-chessboard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ onMove, gestureEnabled, fen }) => {
      return (
        <View testID="mock-chessboard">
          <Text testID="mock-fen">{fen}</Text>
          <Text testID="mock-gesture-enabled">{gestureEnabled.toString()}</Text>
        </View>
      );
    }),
  };
});

// Mock the ThemeContext
jest.mock('../contexts/ThemeContext', () => {
  const React = require('react');
  
  const mockTheme = {
    primary: '#000000',
    text: '#000000',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#000000',
  };
  
  return {
    useTheme: jest.fn().mockReturnValue({
      theme: mockTheme,
      themeMode: 'light',
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock the boardOrientation functions for controlled testing
jest.mock('../utils/boardOrientation', () => {
  return {
    getOrientationForPuzzle: jest.fn().mockImplementation((isWhiteToMove) => 
      isWhiteToMove ? 'white' : 'black'
    ),
    shouldFlipBoard: jest.fn().mockImplementation((orientation) => 
      orientation === 'black'
    ),
    calculateBoardTransform: jest.fn().mockImplementation((isFlipped) => 
      [{ rotate: isFlipped ? '180deg' : '0deg' }]
    ),
    calculatePieceTransform: jest.fn().mockReturnValue([]),
    mapTouchCoordinates: jest.fn().mockImplementation((x, y, boardSize, isFlipped) => {
      if (!isFlipped) return { x, y };
      return { x: boardSize - x, y: boardSize - y };
    }),
    BoardOrientation: undefined
  };
});

describe('Puzzle Orientation Integration', () => {
  // Sample puzzle data - based on our debug validation test
  // For white to move: initialPly must be 1 or 3 (validated from debug test)
  const whitePuzzlePgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5';
  const whitePuzzleInitialPly = 1; // After initialPly + 1 = 2 half-moves, it's white's turn
  
  // For black to move: initialPly must be 0 or 2 or 4 (validated from debug test)
  const blackPuzzlePgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5';
  const blackPuzzleInitialPly = 0; // After initialPly + 1 = 1 half-move, it's black's turn
  
  beforeEach(() => {
    // Reset mock implementations before each test
    jest.clearAllMocks();
    
    // Set up mock implementations for each test
    (boardOrientation.getOrientationForPuzzle as jest.Mock).mockImplementation((isWhiteToMove) => 
      isWhiteToMove ? 'white' : 'black'
    );
    
    (boardOrientation.shouldFlipBoard as jest.Mock).mockImplementation((orientation) => 
      orientation === 'black'
    );
    
    (boardOrientation.calculateBoardTransform as jest.Mock).mockImplementation((isFlipped) => 
      [{ rotate: isFlipped ? '180deg' : '0deg' }]
    );
  });
  
  it('initializes with correct orientation based on white-to-move puzzle', () => {
    // Get puzzle position - white to move after 6 half-moves
    const { fen, isWhiteToMove } = getPuzzlePosition(whitePuzzlePgn, whitePuzzleInitialPly);
    expect(isWhiteToMove).toBe(true); // Make sure our test data is correct
    
    // Mock the orientation utility functions
    const getOrientationSpy = boardOrientation.getOrientationForPuzzle as jest.Mock;
    const shouldFlipSpy = boardOrientation.shouldFlipBoard as jest.Mock;
    const boardTransformSpy = boardOrientation.calculateBoardTransform as jest.Mock;
    
    // Render the component
    const { getByTestId } = render(
      <OrientableChessBoard 
        fen={fen} 
        orientation={getOrientationSpy(isWhiteToMove)} 
      />
    );
    
    // Verify correct orientation is calculated
    expect(getOrientationSpy).toHaveBeenCalledWith(true);
    expect(getOrientationSpy).toHaveReturnedWith('white');
    
    // Verify board flipping calculation
    expect(shouldFlipSpy).toHaveBeenCalledWith('white');
    expect(shouldFlipSpy).toHaveReturnedWith(false);
    
    // Verify board transform
    expect(boardTransformSpy).toHaveBeenCalledWith(false);
    expect(boardTransformSpy).toHaveReturnedWith([{ rotate: '0deg' }]);
    
    // Verify chessboard exists and shows correct FEN
    expect(getByTestId('mock-chessboard')).toBeTruthy();
    expect(getByTestId('mock-fen').props.children).toBe(fen);
  });
  
  it('initializes with correct orientation based on black-to-move puzzle', () => {
    // Get puzzle position - black to move after 5 half-moves
    const { fen, isWhiteToMove } = getPuzzlePosition(blackPuzzlePgn, blackPuzzleInitialPly);
    expect(isWhiteToMove).toBe(false); // Make sure our test data is correct
    
    // Mock the orientation utility functions
    const getOrientationSpy = boardOrientation.getOrientationForPuzzle as jest.Mock;
    const shouldFlipSpy = boardOrientation.shouldFlipBoard as jest.Mock;
    const boardTransformSpy = boardOrientation.calculateBoardTransform as jest.Mock;
    
    // Render the component
    const { getByTestId } = render(
      <OrientableChessBoard 
        fen={fen} 
        orientation={getOrientationSpy(isWhiteToMove)} 
      />
    );
    
    // Verify correct orientation is calculated
    expect(getOrientationSpy).toHaveBeenCalledWith(false);
    expect(getOrientationSpy).toHaveReturnedWith('black');
    
    // Verify board flipping calculation
    expect(shouldFlipSpy).toHaveBeenCalledWith('black');
    expect(shouldFlipSpy).toHaveReturnedWith(true);
    
    // Verify board transform
    expect(boardTransformSpy).toHaveBeenCalledWith(true);
    expect(boardTransformSpy).toHaveReturnedWith([{ rotate: '180deg' }]);
    
    // Verify chessboard exists and shows correct FEN
    expect(getByTestId('mock-chessboard')).toBeTruthy();
    expect(getByTestId('mock-fen').props.children).toBe(fen);
  });
  
  it('handles orientation changes correctly', () => {
    // Get puzzle position (white to move)
    const { fen, isWhiteToMove } = getPuzzlePosition(whitePuzzlePgn, whitePuzzleInitialPly);
    
    // Create a component with state for manual testing
    const TestComponent: React.FC = () => {
      const [orientation, setOrientation] = React.useState<'white' | 'black'>('white');
      
      return (
        <View>
          <OrientableChessBoard 
            fen={fen} 
            orientation={orientation} 
          />
          <View 
            testID="flip-button"
            onTouchEnd={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
          >
            <Text>Flip Board</Text>
          </View>
          <Text testID="current-orientation">{orientation}</Text>
        </View>
      );
    };
    
    // Render the test component
    const { getByTestId } = render(<TestComponent />);
    
    // Initial state - should be white orientation
    expect(getByTestId('current-orientation').props.children).toBe('white');
    
    // Flip the orientation
    fireEvent(getByTestId('flip-button'), 'onTouchEnd');
    
    // Verify orientation changed
    expect(getByTestId('current-orientation').props.children).toBe('black');
    
    // Flip back
    fireEvent(getByTestId('flip-button'), 'onTouchEnd');
    
    // Verify orientation changed back
    expect(getByTestId('current-orientation').props.children).toBe('white');
  });
  
  // Debug validation test to verify our ply values
  it('validates puzzle position calculation', () => {
    const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5';
    
    // Test multiple initialPly values to see what comes out
    let results = '';
    for (let ply = 0; ply < 10; ply++) {
      const { isWhiteToMove } = getPuzzlePosition(pgn, ply);
      results += `Ply ${ply}: ${isWhiteToMove ? 'White' : 'Black'}, `;
    }
    console.log(results);
    
    // Verify our test values
    const { isWhiteToMove: whiteTest } = getPuzzlePosition(whitePuzzlePgn, whitePuzzleInitialPly);
    const { isWhiteToMove: blackTest } = getPuzzlePosition(blackPuzzlePgn, blackPuzzleInitialPly);
    
    console.log(`White test (ply=${whitePuzzleInitialPly}): ${whiteTest ? 'White' : 'Black'}`);
    console.log(`Black test (ply=${blackPuzzleInitialPly}): ${blackTest ? 'White' : 'Black'}`);
    
    // These should match our expected values
    expect(whiteTest).toBe(true);
    expect(blackTest).toBe(false);
  });
}); 