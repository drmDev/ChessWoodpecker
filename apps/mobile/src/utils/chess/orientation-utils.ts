import type { Square } from 'chess.js';

/**
 * Maps algebraic notation to board coordinates based on orientation
 */
export function mapSquareToCoordinates(
  square: Square, 
  orientation: 'white' | 'black',
  pieceSize: number
): { x: number, y: number } {
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
  pieceSize: number
): Square {
  const { x, y } = coordinates;
  
  if (orientation === 'white') {
    const fileIndex = Math.floor(x / pieceSize);
    const rankIndex = 7 - Math.floor(y / pieceSize);
    
    const file = String.fromCharCode(97 + fileIndex);
    const rank = String(rankIndex + 1);
    
    return `${file}${rank}` as Square;
  } else {
    const fileIndex = 7 - Math.floor(x / pieceSize);
    const rankIndex = Math.floor(y / pieceSize);
    
    const file = String.fromCharCode(97 + fileIndex);
    const rank = String(rankIndex + 1);
    
    return `${file}${rank}` as Square;
  }
}

/**
 * Determines if a coordinate label should be shown based on orientation
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