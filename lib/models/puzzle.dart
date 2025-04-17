import 'package:chess/chess.dart' as chess;

class Puzzle {
  final String id;
  final String fen;
  final List<String> solutionMoves; // UCI format
  final String theme;
  final bool isWhiteToMove;
  int attempts;

  Puzzle({
    required this.id,
    required this.fen,
    required this.solutionMoves,
    required this.theme,
    required this.isWhiteToMove,
    this.attempts = 0,
  });

  factory Puzzle.fromJson(Map<String, dynamic> json) {
    return Puzzle(
      id: json['lichess_puzzle_id'] as String,
      fen: json['fen'] as String,
      solutionMoves: List<String>.from(json['solution'] as List),
      theme: json['theme'] as String? ?? 'Uncategorized',
      isWhiteToMove: json['is_white_to_move'] as bool,
      attempts: json['attempts'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lichess_puzzle_id': id,
      'fen': fen,
      'solution': solutionMoves,
      'theme': theme,
      'is_white_to_move': isWhiteToMove,
      'attempts': attempts,
    };
  }
} 