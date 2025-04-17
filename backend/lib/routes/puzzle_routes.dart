import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/puzzle_service.dart';
import '../models/puzzle.dart';

void puzzleRoutes(Router router) {
  final puzzleService = PuzzleService();
  
  // Get a puzzle by ID
  router.get('/puzzles/<id>', (Request request) async {
    final id = request.params['id'];
    if (id == null) {
      return Response.badRequest(body: 'Puzzle ID is required');
    }
    
    try {
      final puzzle = await puzzleService.getPuzzleById(id);
      if (puzzle == null) {
        return Response.notFound('Puzzle not found');
      }
      
      return Response.ok(
        jsonEncode(puzzle.toJson()),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(body: 'Error fetching puzzle: $e');
    }
  });
  
  // Get a random puzzle
  router.get('/puzzles/random', (Request request) async {
    try {
      final puzzle = await puzzleService.getRandomPuzzle();
      if (puzzle == null) {
        return Response.notFound('No puzzles available');
      }
      
      return Response.ok(
        jsonEncode(puzzle.toJson()),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(body: 'Error fetching random puzzle: $e');
    }
  });
  
  // Get next puzzle in sequence
  router.get('/puzzles/next', (Request request) async {
    try {
      final puzzle = await puzzleService.getNextPuzzle();
      if (puzzle == null) {
        return Response.notFound('No more puzzles available');
      }
      
      return Response.ok(
        jsonEncode(puzzle.toJson()),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(body: 'Error fetching next puzzle: $e');
    }
  });
  
  // Reset puzzle sequence
  router.post('/puzzles/reset', (Request request) async {
    try {
      final count = puzzleService.resetPuzzleSequence();
      return Response.ok(
        jsonEncode({'message': 'Puzzle sequence reset', 'count': count}),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(body: 'Error resetting puzzle sequence: $e');
    }
  });
} 