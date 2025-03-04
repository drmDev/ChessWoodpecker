import { mapCoordinatesToSquare, mapSquareToCoordinates } from '../orientation-utils';

describe('orientation-utils', () => {
  describe('mapCoordinatesToSquare', () => {
    const squareSize = 50; // 50px per square

    test('maps coordinates to squares in white orientation', () => {
      // Test each corner of the board
      expect(mapCoordinatesToSquare({ x: 0, y: 350 }, 'white', squareSize)).toBe('a1');
      expect(mapCoordinatesToSquare({ x: 350, y: 350 }, 'white', squareSize)).toBe('h1');
      expect(mapCoordinatesToSquare({ x: 0, y: 0 }, 'white', squareSize)).toBe('a8');
      expect(mapCoordinatesToSquare({ x: 350, y: 0 }, 'white', squareSize)).toBe('h8');
      
      // Test middle squares
      expect(mapCoordinatesToSquare({ x: 200, y: 150 }, 'white', squareSize)).toBe('e5');
      expect(mapCoordinatesToSquare({ x: 150, y: 200 }, 'white', squareSize)).toBe('d4');
    });

    test('maps coordinates to squares in black orientation', () => {
      // Test each corner of the board
      expect(mapCoordinatesToSquare({ x: 350, y: 0 }, 'black', squareSize)).toBe('a1');
      expect(mapCoordinatesToSquare({ x: 0, y: 0 }, 'black', squareSize)).toBe('h1');
      expect(mapCoordinatesToSquare({ x: 350, y: 350 }, 'black', squareSize)).toBe('a8');
      expect(mapCoordinatesToSquare({ x: 0, y: 350 }, 'black', squareSize)).toBe('h8');
      
      // Test middle squares
      expect(mapCoordinatesToSquare({ x: 150, y: 200 }, 'black', squareSize)).toBe('e5');
      expect(mapCoordinatesToSquare({ x: 200, y: 150 }, 'black', squareSize)).toBe('d4');
    });

    test('handles out of bounds coordinates', () => {
      // Test coordinates outside the board
      expect(mapCoordinatesToSquare({ x: -50, y: 200 }, 'white', squareSize)).toBe('a4');
      expect(mapCoordinatesToSquare({ x: 450, y: 200 }, 'white', squareSize)).toBe('h4');
      expect(mapCoordinatesToSquare({ x: 200, y: -50 }, 'white', squareSize)).toBe('e8');
      expect(mapCoordinatesToSquare({ x: 200, y: 450 }, 'white', squareSize)).toBe('e1');
    });
  });

  describe('mapSquareToCoordinates', () => {
    const squareSize = 50;

    test('maps squares to coordinates in white orientation', () => {
      expect(mapSquareToCoordinates('a1', 'white', squareSize)).toEqual({ x: 0, y: 350 });
      expect(mapSquareToCoordinates('h8', 'white', squareSize)).toEqual({ x: 350, y: 0 });
      expect(mapSquareToCoordinates('e4', 'white', squareSize)).toEqual({ x: 200, y: 200 });
    });

    test('maps squares to coordinates in black orientation', () => {
      expect(mapSquareToCoordinates('a1', 'black', squareSize)).toEqual({ x: 350, y: 0 });
      expect(mapSquareToCoordinates('h8', 'black', squareSize)).toEqual({ x: 0, y: 350 });
      expect(mapSquareToCoordinates('e4', 'black', squareSize)).toEqual({ x: 150, y: 150 });
    });
  });
}); 