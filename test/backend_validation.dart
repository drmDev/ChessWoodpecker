import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:test/test.dart';

void main() {
  const baseUrl = 'http://localhost:8080'; // Change this if your backend runs on a different port
  
  group('Backend Validation Tests', () {
    test('Fetch and validate puzzle distribution', () async {
      // First, get all puzzles
      final response = await http.get(Uri.parse('$baseUrl/puzzles'));
      expect(response.statusCode, 200, reason: 'Failed to fetch puzzles');
      
      final List<dynamic> puzzles = jsonDecode(response.body);
      print('\nTotal puzzles fetched: ${puzzles.length}');
      
      // Map to store puzzles by theme
      final Map<String, List<String>> puzzlesByTheme = {};
      final Set<String> uniquePuzzleIds = {};
      
      // Process all puzzles
      for (final puzzle in puzzles) {
        final theme = puzzle['theme'] as String;
        final id = puzzle['id'] as String;
        
        uniquePuzzleIds.add(id);
        puzzlesByTheme.putIfAbsent(theme, () => []).add(id);
      }
      
      // Validate total unique puzzles
      print('\nTotal unique puzzles: ${uniquePuzzleIds.length}');
      expect(uniquePuzzleIds.length, 200, reason: 'Expected 200 unique puzzles');
      
      // Validate theme distribution
      print('\nPuzzle distribution by theme:');
      puzzlesByTheme.forEach((theme, puzzles) {
        print('$theme: ${puzzles.length} puzzles');
        expect(puzzles.length, 20, reason: 'Expected 20 puzzles for theme: $theme');
      });
      
      // Validate we have exactly 10 themes
      expect(puzzlesByTheme.length, 10, reason: 'Expected exactly 10 themes');
      
      // Print sample puzzle data
      print('\nSample puzzle data:');
      print(jsonEncode(puzzles.first));
    });
  });
} 