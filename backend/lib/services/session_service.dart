import '../models/puzzle.dart';
import '../repositories/puzzle_repository.dart';

class SessionService {
  final PuzzleRepository _repository;
  final Map<String, Set<String>> _userAttemptedPuzzles = {};

  SessionService(this._repository);

  String createSession() {
    final sessionId = DateTime.now().millisecondsSinceEpoch.toString();
    _userAttemptedPuzzles[sessionId] = {};
    return sessionId;
  }

  Future<Puzzle?> getNextPuzzle(String sessionId) async {
    if (!_userAttemptedPuzzles.containsKey(sessionId)) {
      throw Exception('Invalid session ID');
    }

    final attemptedPuzzles = _userAttemptedPuzzles[sessionId]!;
    if (attemptedPuzzles.length >= 200) {
      return null; // All puzzles completed
    }

    // Get a random puzzle that hasn't been attempted yet
    final allPuzzles = await _repository.getAllPuzzles();
    final availablePuzzles = allPuzzles.where((p) => !attemptedPuzzles.contains(p.id)).toList();
    
    if (availablePuzzles.isEmpty) {
      return null;
    }

    // Select a random puzzle from available ones
    availablePuzzles.shuffle();
    final nextPuzzle = availablePuzzles.first;
    
    // Mark this puzzle as attempted
    attemptedPuzzles.add(nextPuzzle.id);
    
    return nextPuzzle;
  }

  int getRemainingPuzzles(String sessionId) {
    if (!_userAttemptedPuzzles.containsKey(sessionId)) {
      throw Exception('Invalid session ID');
    }
    return 200 - _userAttemptedPuzzles[sessionId]!.length;
  }

  bool isSessionComplete(String sessionId) {
    if (!_userAttemptedPuzzles.containsKey(sessionId)) {
      throw Exception('Invalid session ID');
    }
    return _userAttemptedPuzzles[sessionId]!.length >= 200;
  }
} 