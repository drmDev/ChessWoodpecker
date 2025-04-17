import 'package:json_annotation/json_annotation.dart';

part 'puzzle.g.dart';

@JsonSerializable()
class Puzzle {
  final String id;
  final String pgn;
  final int initialPly;
  final List<String> solution;
  final String theme;

  Puzzle({
    required this.id,
    required this.pgn,
    required this.initialPly,
    required this.solution,
    required this.theme,
  });

  factory Puzzle.fromJson(Map<String, dynamic> json) => _$PuzzleFromJson(json);
  Map<String, dynamic> toJson() => _$PuzzleToJson(this);

  factory Puzzle.fromMap(Map<String, dynamic> map) {
    return Puzzle(
      id: map['lichess_puzzle_id'] as String,
      pgn: map['pgn'] as String,
      initialPly: map['initial_ply'] as int,
      solution: List<String>.from(map['solution'] as List),
      theme: map['theme'] as String,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'pgn': pgn,
      'initial_ply': initialPly,
      'solution': solution,
      'theme': theme,
    };
  }
} 