import type { Square } from 'chess.js';

export type BoardOrientation = 'white' | 'black';

/**
 * Maps algebraic notation to board coordinates based on orientation
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