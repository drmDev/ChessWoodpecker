import { Chess } from 'chess.js';
import { validatePuzzleMove } from '../PuzzleMoveValidator';
import { 
  FEN_STARTING_POSITION,
  FEN_CAPTURE_POSITION, 
  FEN_CASTLING_POSITION, 
  FEN_KNIGHT_CAPTURE_POSITION,
  FEN_WHITE_PROMOTION_CHECK,
  FEN_PINNED_BISHOP,
  FEN_CASTLING_RIGHTS_LOST,
  FEN_CASTLING_THROUGH_CHECK,
  FEN_PROMOTION_REQUIRED
} from '../../testing/chess-test-utils';

describe('PuzzleMoveValidator', () => {
  describe('validatePuzzleMove', () => {
    // Test Case 1: Basic correct move validation
    it('should validate a correct first move in the solution', () => {
      const position = new Chess(FEN_CAPTURE_POSITION);
      const solutionMoves = ['d2d4', 'c6d4', 'f3d4']; // Example: White plays d4
      const userMove = { from: 'd2', to: 'd4' };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.nextMove).toBe('c6d4');
    });

    // Test Case 2: Incorrect move validation
    it('should invalidate an incorrect move', () => {
      const position = new Chess(FEN_CAPTURE_POSITION);
      const solutionMoves = ['d2d4', 'c6d4', 'f3d4'];
      const userMove = { from: 'e4', to: 'e5' }; // Wrong move
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.nextMove).toBeNull();
    });

    // Test Case 3: Validate move in the middle of solution sequence
    it('should validate a correct move in the middle of the solution', () => {
      const position = new Chess(FEN_KNIGHT_CAPTURE_POSITION);
      const solutionMoves = ['d2d4', 'c6d4', 'f3d4'];
      const userMove = { from: 'f3', to: 'd4' }; // White recaptures with knight
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 2);
      
      expect(result.isValid).toBe(true);
      expect(result.nextMove).toBeNull(); // Last move in sequence
      expect(result.isComplete).toBe(true);
    });

    // Test Case 4: Handle all legal promotion moves
    it.each([
      ['q', true],  // Queen puts king in check
      ['r', true],  // Rook puts king in check
      ['b', false], // Bishop doesn't check
      ['n', false]  // Knight doesn't check
    ])('should validate promotion to %s correctly', (promotionPiece, givesCheck) => {
      const position = new Chess(FEN_WHITE_PROMOTION_CHECK);
      const solutionMoves = [`e7e8${promotionPiece}`];
      const userMove = { from: 'e7', to: 'e8', promotion: promotionPiece };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      // Verify the move is valid
      expect(result.isValid).toBe(true);
      expect(result.isComplete).toBe(true);
      
      // Verify check status
      const testPosition = new Chess(position.fen());
      testPosition.move(userMove);
      expect(testPosition.inCheck()).toBe(givesCheck);
    });

    // Test Case 5: Handle invalid promotion piece
    it('should invalidate an incorrect promotion piece', () => {
      const position = new Chess(FEN_WHITE_PROMOTION_CHECK);
      const solutionMoves = ['e7e8q']; // Solution promotes to queen
      const userMove = { from: 'e7', to: 'e8', promotion: 'p' }; // Invalid piece type
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(false);
    });

    // Test Case 6: Validate complete puzzle solution
    it('should indicate when puzzle is complete', () => {
      const position = new Chess(FEN_CAPTURE_POSITION);
      const solutionMoves = ['d2d4'];
      const userMove = { from: 'd2', to: 'd4' };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.nextMove).toBeNull();
    });

    // Test Case 7: Validate pinned piece cannot move
    it('should invalidate moves of a pinned piece', () => {
      const position = new Chess(FEN_PINNED_BISHOP);
      const solutionMoves = ['e2f3']; // This move would be check if the bishop weren't pinned
      const userMove = { from: 'e2', to: 'f3' };
      
      // First verify the position is what we expect
      const bishop = position.get('e2');
      expect(bishop?.type).toBe('b'); // Bishop
      expect(bishop?.color).toBe('w'); // White
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      // The move should be invalid because the bishop is pinned
      expect(result.isValid).toBe(false);
      expect(result.nextMove).toBeNull();
      
      // Verify the move is actually illegal in chess.js
      const testPosition = new Chess(position.fen());
      let moveWasIllegal = false;
      try {
        const moveResult = testPosition.move(userMove);
        moveWasIllegal = moveResult === null;
      } catch (_) {
        // chess.js throws an exception for illegal moves
        moveWasIllegal = true;
      }
      expect(moveWasIllegal).toBe(true); // Move should be rejected one way or another
    });

    // Test Case 8: Initial pawn two-square advance
    it('should validate initial pawn two-square advance', () => {
      const position = new Chess(FEN_STARTING_POSITION);
      const solutionMoves = ['d2d4'];
      const userMove = { from: 'd2', to: 'd4' };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(true);
    });

    // Test Case 9: Legal castling moves
    it.each([
      ['O-O', 'e1g1'],   // Kingside castle
      ['O-O-O', 'e1c1']  // Queenside castle
    ])('should validate legal %s castling', (notation, uciMove) => {
      const position = new Chess(FEN_CASTLING_POSITION);
      const solutionMoves = [uciMove];
      const [from, to] = [uciMove.slice(0, 2), uciMove.slice(2, 4)];
      const userMove = { from, to };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(true);
    });

    // Test Case 10: Castling rights lost after rook move
    it('should invalidate kingside castle after rook move', () => {
      const position = new Chess(FEN_CASTLING_RIGHTS_LOST);
      const solutionMoves = ['e1g1']; // Attempt kingside castle
      const userMove = { from: 'e1', to: 'g1' };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(false);
      
      // Verify queenside castle is still valid
      const qSideCastle = validatePuzzleMove(position, { from: 'e1', to: 'c1' }, ['e1c1'], 0);
      expect(qSideCastle.isValid).toBe(true);
    });

    // Test Case 11: Castling through check
    it('should invalidate castling through check', () => {
      const position = new Chess(FEN_CASTLING_THROUGH_CHECK);
      const solutionMoves = ['e1g1']; // Attempt kingside castle
      const userMove = { from: 'e1', to: 'g1' };
      
      const result = validatePuzzleMove(position, userMove, solutionMoves, 0);
      
      expect(result.isValid).toBe(false);
      
      // Verify queenside castle is still valid
      const qSideCastle = validatePuzzleMove(position, { from: 'e1', to: 'c1' }, ['e1c1'], 0);
      expect(qSideCastle.isValid).toBe(true);
    });

    // Test Case 12: Required promotion move in solution
    it('should validate promotion move when required by solution', () => {
      const position = new Chess(FEN_PROMOTION_REQUIRED);
      const solutionMoves = ['e7e8q']; // Solution requires queen promotion
      
      // Test with correct promotion
      const correctMove = { from: 'e7', to: 'e8', promotion: 'q' };
      const correctResult = validatePuzzleMove(position, correctMove, solutionMoves, 0);
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.isComplete).toBe(true);
      
      // Test with wrong promotion piece
      const wrongPieceMove = { from: 'e7', to: 'e8', promotion: 'r' };
      const wrongPieceResult = validatePuzzleMove(position, wrongPieceMove, solutionMoves, 0);
      expect(wrongPieceResult.isValid).toBe(false);
      
      // Test with missing promotion
      const missingPromotionMove = { from: 'e7', to: 'e8' };
      const missingPromotionResult = validatePuzzleMove(position, missingPromotionMove, solutionMoves, 0);
      expect(missingPromotionResult.isValid).toBe(false);
    });
  });
}); 