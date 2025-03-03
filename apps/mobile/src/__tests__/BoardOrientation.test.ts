import { 
  calculateBoardTransform, 
  calculatePieceTransform, 
  calculateCoordinateTransform,
  shouldFlipBoard,
  mapTouchCoordinates,
  getOrientationForPuzzle
} from '../utils/boardOrientation';

describe('Board Orientation Utilities', () => {
  describe('shouldFlipBoard', () => {
    it('should return true when orientation is black', () => {
      expect(shouldFlipBoard('black')).toBe(true);
    });

    it('should return false when orientation is white', () => {
      expect(shouldFlipBoard('white')).toBe(false);
    });

    it('should return false when orientation is not specified', () => {
      expect(shouldFlipBoard()).toBe(false);
    });
  });

  describe('calculateBoardTransform', () => {
    it('should return 180deg rotation when flipped', () => {
      const transform = calculateBoardTransform(true);
      expect(transform).toEqual([{ rotate: '180deg' }]);
    });

    it('should return 0deg rotation when not flipped', () => {
      const transform = calculateBoardTransform(false);
      expect(transform).toEqual([{ rotate: '0deg' }]);
    });
  });

  describe('calculatePieceTransform', () => {
    it('should return counter-rotation when board is flipped', () => {
      const transform = calculatePieceTransform(true);
      expect(transform).toEqual([{ rotate: '180deg' }]);
    });

    it('should return no rotation when board is not flipped', () => {
      const transform = calculatePieceTransform(false);
      expect(transform).toEqual([]);
    });
  });

  describe('calculateCoordinateTransform', () => {
    it('should flip coordinates when board is flipped', () => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      
      const { transformedFiles, transformedRanks } = calculateCoordinateTransform(true, files, ranks);
      
      expect(transformedFiles).toEqual(['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']);
      expect(transformedRanks).toEqual(['8', '7', '6', '5', '4', '3', '2', '1']);
    });

    it('should keep coordinates unchanged when board is not flipped', () => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      
      const { transformedFiles, transformedRanks } = calculateCoordinateTransform(false, files, ranks);
      
      expect(transformedFiles).toEqual(files);
      expect(transformedRanks).toEqual(ranks);
    });
  });

  describe('mapTouchCoordinates', () => {
    it('should invert coordinates when board is flipped', () => {
      const boardSize = 320;
      const x = 100;
      const y = 200;
      
      const { x: newX, y: newY } = mapTouchCoordinates(x, y, boardSize, true);
      
      expect(newX).toBe(boardSize - x);
      expect(newY).toBe(boardSize - y);
    });

    it('should keep coordinates unchanged when board is not flipped', () => {
      const boardSize = 320;
      const x = 100;
      const y = 200;
      
      const { x: newX, y: newY } = mapTouchCoordinates(x, y, boardSize, false);
      
      expect(newX).toBe(x);
      expect(newY).toBe(y);
    });
  });

  describe('getOrientationForPuzzle', () => {
    it('should return white orientation when white is to move', () => {
      expect(getOrientationForPuzzle(true)).toBe('white');
    });

    it('should return black orientation when black is to move', () => {
      expect(getOrientationForPuzzle(false)).toBe('black');
    });
  });
}); 