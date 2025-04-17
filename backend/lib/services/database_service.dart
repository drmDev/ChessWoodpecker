import 'package:postgres/postgres.dart';
import 'package:dotenv/dotenv.dart';
import '../models/puzzle.dart';

class DatabaseService {
  late Connection _connection;
  static DatabaseService? _instance;

  DatabaseService._();

  static DatabaseService get instance {
    _instance ??= DatabaseService._();
    return _instance!;
  }

  Future<void> connect() async {
    final env = DotEnv()..load();
    final connectionString = env['DATABASE_PUBLIC_URL'] ?? '';
    
    final uri = Uri.parse(connectionString);
    _connection = await Connection.open(Endpoint(
      host: uri.host,
      port: uri.port,
      database: uri.pathSegments.first,
      username: uri.userInfo.split(':').first,
      password: uri.userInfo.split(':').last,
    ));
  }

  Future<void> close() async {
    await _connection.close();
  }

  Future<List<Map<String, dynamic>>> query(String sql, [List<dynamic>? params]) async {
    final results = await _connection.execute(
      Sql.named(sql),
      parameters: params != null ? Map.fromIterables(
        List.generate(params.length, (i) => 'p$i'),
        params
      ) : {},
    );
    return results.map((row) => row.toColumnMap()).toList();
  }

  Future<Puzzle?> getPuzzleById(String id) async {
    final results = await _connection.execute(
      Sql.named('SELECT * FROM lichess_puzzle_cache WHERE lichess_puzzle_id = @id'),
      parameters: {'id': id},
    );

    if (results.isEmpty) return null;

    final row = results.first.toColumnMap();
    return Puzzle(
      id: row['lichess_puzzle_id'] as String,
      pgn: row['pgn'] as String,
      initialPly: row['initial_ply'] as int,
      solution: (row['solution'] as List).cast<String>(),
      theme: row['theme'] as String,
    );
  }

  Future<Puzzle?> getRandomPuzzle() async {
    final results = await _connection.execute(
      'SELECT * FROM lichess_puzzle_cache ORDER BY RANDOM() LIMIT 1',
    );

    if (results.isEmpty) return null;

    final row = results.first.toColumnMap();
    return Puzzle(
      id: row['lichess_puzzle_id'] as String,
      pgn: row['pgn'] as String,
      initialPly: row['initial_ply'] as int,
      solution: (row['solution'] as List).cast<String>(),
      theme: row['theme'] as String,
    );
  }
} 