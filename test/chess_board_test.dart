import 'package:chess/chess.dart' as chess;
import 'package:test/test.dart';

void main() {
  group('Chess Board Basic Tests', () {
    test('creates chessboard in correct starting position', () {
      // Create a new chess board
      final board = chess.Chess();

      // Verify starting position FEN
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(board.fen, equals(startingFen));

      // Verify it's white's turn to move
      expect(board.turn, equals(chess.Color.WHITE));

      // Verify game state
      expect(board.in_check, isFalse);
      expect(board.in_checkmate, isFalse);
      expect(board.in_stalemate, isFalse);
      expect(board.in_draw, isFalse);

      // Verify piece positions - check a few key pieces
      final whiteKing = board.get('e1');
      expect(whiteKing, isNotNull);
      expect(whiteKing!.type, equals(chess.Chess.KING));
      expect(whiteKing.color, equals(chess.Color.WHITE));

      final blackKing = board.get('e8');
      expect(blackKing, isNotNull);
      expect(blackKing!.type, equals(chess.Chess.KING));
      expect(blackKing.color, equals(chess.Color.BLACK));

      // Verify empty square
      expect(board.get('e4'), isNull);
    });
  });
}
