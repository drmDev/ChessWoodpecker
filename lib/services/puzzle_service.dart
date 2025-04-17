import 'dart:convert';
import 'package:chess/chess.dart' as chess;
import 'package:shared_preferences.dart';
import '../models/puzzle.dart';

class PuzzleService {
  static const String _completedPuzzlesKey = 'completed_puzzles';
  final SharedPreferences _prefs;
  final String _baseUrl;

  PuzzleService(this._prefs, {String baseUrl = 'https://chesswoodpecker-production-8791.up.railway.app/api'})
      : _baseUrl = baseUrl;

  // Fetch a puzzle by ID
  Future<Puzzle?> fetchPuzzle(String id) async {
    try {
      final response = await Uri.parse('$_baseUrl/puzzles/$id').get();
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Puzzle.fromJson(data);
      }
      return null;
    } catch (e) {
      print('Error fetching puzzle: $e');
      return null;
    }
  }

  // Validate a move against the puzzle solution
  bool validateMove(Puzzle puzzle, String move, int moveIndex) {
    if (moveIndex >= puzzle.solutionMoves.length) return false;
    return move == puzzle.solutionMoves[moveIndex];
  }

  // Mark a puzzle as completed
  Future<void> markPuzzleCompleted(String puzzleId) async {
    final completedPuzzles = _prefs.getStringList(_completedPuzzlesKey) ?? [];
    if (!completedPuzzles.contains(puzzleId)) {
      completedPuzzles.add(puzzleId);
      await _prefs.setStringList(_completedPuzzlesKey, completedPuzzles);
    }
  }

  // Get all completed puzzle IDs
  List<String> getCompletedPuzzles() {
    return _prefs.getStringList(_completedPuzzlesKey) ?? [];
  }

  // Check if a puzzle is completed
  bool isPuzzleCompleted(String puzzleId) {
    final completedPuzzles = getCompletedPuzzles();
    return completedPuzzles.contains(puzzleId);
  }
} 