import '../models/puzzle.dart';
import '../services/database_service.dart';

class PuzzleRepository {
  final DatabaseService _database;

  PuzzleRepository(this._database);

  Future<List<Puzzle>> getAllPuzzles() async {
    final result = await _database.query('SELECT * FROM lichess_puzzle_cache');
    return result
        .map((row) => Puzzle(
              id: row['lichess_puzzle_id'] as String,
              pgn: row['pgn'] as String,
              initialPly: row['initial_ply'] as int,
              solution: (row['solution'] as List).cast<String>(),
              theme: row['theme'] as String,
            ))
        .toList();
  }

  Future<Puzzle?> getRandomPuzzle() async {
    final result = await _database
        .query('SELECT * FROM lichess_puzzle_cache ORDER BY RANDOM() LIMIT 1');
    if (result.isEmpty) return null;
    final row = result.first;
    return Puzzle(
      id: row['lichess_puzzle_id'] as String,
      pgn: row['pgn'] as String,
      initialPly: row['initial_ply'] as int,
      solution: (row['solution'] as List).cast<String>(),
      theme: row['theme'] as String,
    );
  }

  Future<Puzzle?> getPuzzleById(String id) async {
    final result = await _database.query(
        'SELECT * FROM lichess_puzzle_cache WHERE lichess_puzzle_id = @p0',
        [id]);
    if (result.isEmpty) return null;
    final row = result.first;
    return Puzzle(
      id: row['lichess_puzzle_id'] as String,
      pgn: row['pgn'] as String,
      initialPly: row['initial_ply'] as int,
      solution: (row['solution'] as List).cast<String>(),
      theme: row['theme'] as String,
    );
  }
}
