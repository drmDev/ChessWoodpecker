import type { Square } from 'chess.js';

export type BoardOrientation = 'white' | 'black';

/**
 * Maps algebraic notation to board coordinates based on orientation
 * Note: This method is currently only used in tests, may be needed for future drag-and-drop functionality
 */
export function mapSquareToCoordinates(
  square: Square, 
  orientation: 'white' | 'black',
  pieceSize: number
): { x: number, y: number } {
  // Validate piece size
  if (pieceSize <= 0) {
    throw new Error('Invalid piece size: must be greater than 0');
  }

  const tokens = square.split('');
  const col = tokens[0];
  const row = tokens[1];
  
  // Validate the notation
  if (!col || !row || 
      col.charCodeAt(0) < 'a'.charCodeAt(0) || 
      col.charCodeAt(0) > 'h'.charCodeAt(0) ||
      parseInt(row, 10) < 1 || 
      parseInt(row, 10) > 8) {
    throw new Error('Invalid notation: ' + square);
  }
  
  const fileIndex = col.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankIndex = parseInt(row, 10) - 1;
  
  if (orientation === 'white') {
    return {
      x: fileIndex * pieceSize,
      y: (7 - rankIndex) * pieceSize,
    };
  } else {
    return {
      x: (7 - fileIndex) * pieceSize,
      y: rankIndex * pieceSize,
    };
  }
}

/**
 * Maps board coordinates to algebraic notation based on orientation
 * Note: This method is currently only used in tests, may be needed for future drag-and-drop functionality
 */
export function mapCoordinatesToSquare(
  coordinates: { x: number, y: number },
  orientation: 'white' | 'black',
  squareSize: number
): Square {
  let { x, y } = coordinates;
  
  // Clamp coordinates to board bounds
  x = Math.max(0, Math.min(x, squareSize * 8 - 1));
  y = Math.max(0, Math.min(y, squareSize * 8 - 1));
  
  // Calculate file and rank indices
  let fileIndex = Math.floor(x / squareSize);
  let rankIndex = Math.floor(y / squareSize);
  
  if (orientation === 'white') {
    // In white orientation: a1 is bottom-left (0,7), h8 is top-right (7,0)
    rankIndex = 7 - rankIndex;
  } else {
    // In black orientation: a1 is top-right (7,0), h8 is bottom-left (0,7)
    fileIndex = 7 - fileIndex;
  }
  
  // Ensure indices are within valid range
  fileIndex = Math.max(0, Math.min(fileIndex, 7));
  rankIndex = Math.max(0, Math.min(rankIndex, 7));
  
  // Convert to algebraic notation
  const file = String.fromCharCode(97 + fileIndex);
  const rank = String(rankIndex + 1);
  
  return `${file}${rank}` as Square;
}

/**
 * Determines if a coordinate label should be shown based on orientation
 * Note: This method is currently unused, may be needed for future coordinate label rendering
 */
export function shouldShowCoordinateLabel(
  type: 'file' | 'rank',
  position: number,
  orientation: 'white' | 'black'
): boolean {
  if (type === 'file') {
    return orientation === 'white' ? position === 7 : position === 0;
  } else {
    return orientation === 'white' ? position === 0 : position === 7;
  }
}

/**
 * Gets the coordinate label value based on position and orientation
 * Note: This method is currently unused, may be needed for future coordinate label rendering
 */
export function getCoordinateLabel(
  type: 'file' | 'rank',
  position: number,
  orientation: 'white' | 'black'
): string {
  if (type === 'file') {
    const index = orientation === 'white' ? position : 7 - position;
    return String.fromCharCode(97 + index);
  } else {
    const index = orientation === 'white' ? 7 - position : position;
    return String(index + 1);
  }
}

/**
 * Calculates the translation values for piece movement based on orientation
 * Note: This method is currently unused, may be needed for future piece animation
 */
export function calculatePieceTranslation(
  translationX: number,
  translationY: number,
  orientation: 'white' | 'black'
): { translationX: number, translationY: number } {
  if (orientation === 'white') {
    return { translationX, translationY };
  } else {
    return { translationX: -translationX, translationY: -translationY };
  }
}

/**
 * Determines if the board should be flipped based on orientation
 * Actively used in LichessApiTestScreen for board orientation
 */
export function shouldFlipBoard(orientation: BoardOrientation): boolean {
  return orientation === 'black';
}

/**
 * Gets the appropriate board orientation based on whose turn it is
 * Actively used in LichessApiTestScreen for auto-orientation
 */
export function getOrientationForPuzzle(isWhiteToMove: boolean): BoardOrientation {
  return isWhiteToMove ? 'white' : 'black';
}

/**
 * Calculates the transform style for the board based on orientation
 * Note: This method is currently unused, may be needed for future board animation
 */
export function calculateBoardTransform(isFlipped: boolean): { transform: { rotate: string } } {
  return {
    transform: {
      rotate: isFlipped ? '180deg' : '0deg'
    }
  };
}

/**
 * Maps touch coordinates to board coordinates based on orientation
 * Note: This method is currently unused, may be needed for future touch interaction
 */
export function mapTouchCoordinates(
  x: number,
  y: number,
  boardSize: number,
  isFlipped: boolean
): { file: number; rank: number } {
  // Calculate square size
  const squareSize = boardSize / 8;
  
  // Get the file and rank (0-7)
  let file = Math.floor(x / squareSize);
  let rank = Math.floor(y / squareSize);
  
  // If board is flipped, invert coordinates
  if (isFlipped) {
    file = 7 - file;
    rank = 7 - rank;
  }
  
  return { file, rank };
}

/**
 * Maps a square name (e.g., 'e4') to board coordinates
 * Note: This method is currently unused, may be needed for future coordinate conversion
 */
export function squareToCoordinates(square: string): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1]);
  return { file, rank };
}

/**
 * Maps board coordinates to a square name
 * Note: This method is currently unused, may be needed for future coordinate conversion
 */
export function coordinatesToSquare(file: number, rank: number): string {
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
  const rankNum = 8 - rank;
  return `${fileChar}${rankNum}`;
} 