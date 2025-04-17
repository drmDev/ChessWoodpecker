import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../models/puzzle.dart';

class PuzzleService {
  static const String _completedPuzzlesKey = 'completed_puzzles';
  final SharedPreferences _prefs;
  final String _baseUrl;
  Map<String, List<String>> _puzzleCollections = {};
  bool _isInitialized = false;

  // Mock puzzle for testing
  static final Puzzle _mockPuzzle = Puzzle(
    id: 'mock_puzzle_1',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solutionMoves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'],
    theme: 'OPENING',
    isWhiteToMove: true,
  );

  PuzzleService(this._prefs,
      {String baseUrl =
          'https://chesswoodpecker-production-8791.up.railway.app/api'})
      : _baseUrl = baseUrl;

  // Fetch a puzzle by ID
  Future<Puzzle?> fetchPuzzle(String id) async {
    // For testing, return the mock puzzle
    if (id == 'test_puzzle_1') {
      return _mockPuzzle;
    }

    try {
      final response = await http.get(Uri.parse('$_baseUrl/puzzles/$id'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Puzzle.fromJson(data);
      } else {
        print('Failed to fetch puzzle: ${response.statusCode}');
        return null;
      }
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

  // Load puzzle collections from JSON file
  Future<void> loadPuzzleCollections() async {
    if (_isInitialized) return;

    try {
      print('Loading puzzle collections from JSON file');
      final String jsonString =
          await rootBundle.loadString('assets/puzzles/default-collection.json');
      final Map<String, dynamic> jsonData = json.decode(jsonString);

      _puzzleCollections = Map.from(jsonData).map(
        (key, value) => MapEntry(key, List<String>.from(value as List)),
      );

      print('Loaded puzzle collections: ${_puzzleCollections.keys.join(', ')}');
      _isInitialized = true;
    } catch (e) {
      print('Error loading puzzle collections: $e');
      _puzzleCollections = {};
    }
  }

  // Get available themes
  List<String> getAvailableThemes() {
    return _puzzleCollections.keys.toList();
  }

  // Get puzzles for a specific theme
  List<String> getPuzzlesForTheme(String theme) {
    return _puzzleCollections[theme] ?? [];
  }

  // Get all puzzle collections
  Map<String, List<String>> getPuzzleCollections() {
    return Map.from(_puzzleCollections);
  }
}
