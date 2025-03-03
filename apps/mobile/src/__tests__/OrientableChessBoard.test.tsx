import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { OrientableChessBoard } from '../components/chess/OrientableChessBoard';
import { ThemeProvider } from '../contexts/ThemeContext';

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

// Mock the boardOrientation utilities
jest.mock('../utils/boardOrientation', () => {
  return {
    shouldFlipBoard: jest.fn().mockImplementation((orientation) => orientation === 'black'),
    calculateBoardTransform: jest.fn().mockImplementation((isFlipped) => 
      [{ rotate: isFlipped ? '180deg' : '0deg' }]
    ),
    calculatePieceTransform: jest.fn().mockImplementation((isFlipped) => 
      isFlipped ? [{ rotate: '180deg' }] : []
    ),
    mapTouchCoordinates: jest.fn().mockImplementation((x, y, boardSize, isFlipped) => {
      if (!isFlipped) return { x, y };
      return { x: boardSize - x, y: boardSize - y };
    }),
  };
});

describe('OrientableChessBoard', () => {
  const renderComponent = (props = {}) => {
    return render(<OrientableChessBoard {...props} />);
  };

  it('renders correctly with default props', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('mock-chessboard')).toBeTruthy();
    expect(getByTestId('mock-gesture-enabled').props.children).toBe('true');
  });

  it('renders correctly with white orientation', () => {
    const { getByTestId, toJSON } = renderComponent({ orientation: 'white' });
    expect(getByTestId('mock-chessboard')).toBeTruthy();
    
    // Check that the board container has the correct transform style
    const tree = toJSON();
    // The board container is the first child of the root View
    const boardContainerStyle = tree.children[0].props.style;
    expect(boardContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          transform: [{ rotate: '0deg' }]
        })
      ])
    );
  });

  it('renders correctly with black orientation', () => {
    const { getByTestId, toJSON } = renderComponent({ orientation: 'black' });
    expect(getByTestId('mock-chessboard')).toBeTruthy();
    
    // Check that the board container has the correct transform style
    const tree = toJSON();
    // The board container is the first child of the root View
    const boardContainerStyle = tree.children[0].props.style;
    expect(boardContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          transform: [{ rotate: '180deg' }]
        })
      ])
    );
  });

  it('disables gestures when disabled prop is true', () => {
    const { getByTestId } = renderComponent({ disabled: true });
    expect(getByTestId('mock-gesture-enabled').props.children).toBe('false');
  });

  it('uses provided FEN when specified', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const { getByTestId } = renderComponent({ fen: testFen });
    expect(getByTestId('mock-fen').props.children).toBe(testFen);
  });
}); 