// Starting position
export const FEN_STARTING_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Promotion test positions
export const FEN_WHITE_PROMOTION_QUEEN_CHECK = 'k7/1P6/8/8/8/8/8/K7 w - - 0 1';
export const FEN_WHITE_PROMOTION_KNIGHT_CHECK = '8/1k1P4/8/8/8/8/8/4K3 w - - 0 1';

// Specific test positions
export const FEN_WHITE_E4_PLAYED = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
export const FEN_CAPTURE_POSITION = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
export const FEN_KNIGHT_CAPTURE_POSITION = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1';
export const FEN_CHECK_POSITION = '4k3/8/8/8/8/8/8/4Q1K1 w - - 0 1';
export const FEN_CASTLING_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';

// Common test utilities
export const createMockChessInstance = () => ({
  load: jest.fn(),
  move: jest.fn(),
  fen: jest.fn(),
  get: jest.fn(),
  turn: jest.fn(),
  inCheck: jest.fn(),
  isGameOver: jest.fn(),
  isCheckmate: jest.fn(),
  isDraw: jest.fn(),
});