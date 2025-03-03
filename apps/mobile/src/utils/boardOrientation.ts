/**
 * Board orientation utilities for chess board rendering
 * 
 * These utilities help implement the Visual Transformation Approach for board orientation
 * as described in the board_orientation.md document.
 */

/**
 * Type for board orientation
 */
export type BoardOrientation = 'white' | 'black';

/**
 * Determines if the board should be flipped based on orientation
 * @param orientation The desired board orientation ('white' or 'black')
 * @returns True if the board should be flipped (orientation is 'black')
 */
export function shouldFlipBoard(orientation?: BoardOrientation): boolean {
  return orientation === 'black';
}

/**
 * Calculates the transform style for the board container
 * @param isFlipped Whether the board should be flipped
 * @returns Transform style array for React Native
 */
export function calculateBoardTransform(isFlipped: boolean): Array<{ rotate: string }> {
  return [{ rotate: isFlipped ? '180deg' : '0deg' }];
}

/**
 * Calculates the transform style for individual pieces
 * @param isFlipped Whether the board is flipped
 * @returns Transform style array for React Native
 */
export function calculatePieceTransform(isFlipped: boolean): Array<{ rotate: string }> {
  return isFlipped ? [{ rotate: '180deg' }] : [];
}

/**
 * Calculates the transformed coordinates for files and ranks
 * @param isFlipped Whether the board is flipped
 * @param files Array of file labels (e.g., ['a', 'b', 'c', ...])
 * @param ranks Array of rank labels (e.g., ['1', '2', '3', ...])
 * @returns Object with transformed files and ranks arrays
 */
export function calculateCoordinateTransform(
  isFlipped: boolean,
  files: string[],
  ranks: string[]
): { transformedFiles: string[]; transformedRanks: string[] } {
  if (!isFlipped) {
    return {
      transformedFiles: [...files],
      transformedRanks: [...ranks]
    };
  }

  return {
    transformedFiles: [...files].reverse(),
    transformedRanks: [...ranks].reverse()
  };
}

/**
 * Maps a screen coordinate to a board coordinate when the board is flipped
 * @param x X coordinate on screen
 * @param y Y coordinate on screen
 * @param boardSize Size of the board in pixels
 * @param isFlipped Whether the board is flipped
 * @returns Transformed coordinates
 */
export function mapTouchCoordinates(
  x: number,
  y: number,
  boardSize: number,
  isFlipped: boolean
): { x: number; y: number } {
  if (!isFlipped) {
    return { x, y };
  }

  // When flipped, invert the coordinates relative to the board size
  return {
    x: boardSize - x,
    y: boardSize - y
  };
}

/**
 * Determines the orientation based on whose turn it is in the puzzle
 * @param isWhiteToMove Whether it's white's turn to move in the puzzle
 * @returns The appropriate board orientation
 */
export function getOrientationForPuzzle(isWhiteToMove: boolean): BoardOrientation {
  // In puzzles, we want the player's side at the bottom
  return isWhiteToMove ? 'white' : 'black';
} 