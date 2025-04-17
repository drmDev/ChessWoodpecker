import 'package:shelf/shelf.dart';
import '../services/puzzle_service.dart';
import '../services/session_service.dart';
import 'dart:convert';

class PuzzleController {
  final PuzzleService _service;
  final SessionService _sessionService;

  PuzzleController(this._service, this._sessionService);

  Handler get handler {
    return Pipeline()
        .addMiddleware(logRequests())
        .addHandler(_handleRequest);
  }

  Future<Response> _handleRequest(Request request) async {
    if (request.method == 'GET') {
      if (request.url.pathSegments.isEmpty || request.url.pathSegments[0] == 'puzzles') {
        return await _getAllPuzzles();
      } else if (request.url.pathSegments.length == 1) {
        if (request.url.pathSegments[0] == 'random') {
          return await _getRandomPuzzle();
        } else if (request.url.pathSegments[0] == 'session') {
          return await _createSession();
        } else {
          return await _getPuzzleById(request.url.pathSegments[0]);
        }
      } else if (request.url.pathSegments.length == 2 && 
                 request.url.pathSegments[0] == 'session') {
        final sessionId = request.url.pathSegments[1];
        if (request.url.queryParameters['action'] == 'next') {
          return await _getNextPuzzle(sessionId);
        } else if (request.url.queryParameters['action'] == 'status') {
          return await _getSessionStatus(sessionId);
        }
      }
    }
    
    return Response.notFound('Not found');
  }

  Future<Response> _createSession() async {
    final sessionId = _sessionService.createSession();
    return Response.ok(
      jsonEncode({'sessionId': sessionId}),
      headers: {'content-type': 'application/json'},
    );
  }

  Future<Response> _getNextPuzzle(String sessionId) async {
    try {
      final puzzle = await _sessionService.getNextPuzzle(sessionId);
      if (puzzle == null) {
        return Response.ok(
          jsonEncode({'status': 'complete', 'message': 'All puzzles completed'}),
          headers: {'content-type': 'application/json'},
        );
      }
      return Response.ok(
        jsonEncode(puzzle.toMap()),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'error': 'Invalid session ID'}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  Future<Response> _getSessionStatus(String sessionId) async {
    try {
      final remaining = _sessionService.getRemainingPuzzles(sessionId);
      final isComplete = _sessionService.isSessionComplete(sessionId);
      return Response.ok(
        jsonEncode({
          'remaining': remaining,
          'isComplete': isComplete,
          'total': 200
        }),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'error': 'Invalid session ID'}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  Future<Response> _getAllPuzzles() async {
    final puzzles = await _service.getAllPuzzles();
    return Response.ok(
      jsonEncode(puzzles.map((p) => p.toMap()).toList()),
      headers: {'content-type': 'application/json'},
    );
  }

  Future<Response> _getRandomPuzzle() async {
    final puzzle = await _service.getRandomPuzzle();
    if (puzzle == null) {
      return Response.notFound('No puzzles available');
    }
    return Response.ok(
      jsonEncode(puzzle.toMap()),
      headers: {'content-type': 'application/json'},
    );
  }

  Future<Response> _getPuzzleById(String id) async {
    final puzzle = await _service.getPuzzleById(id);
    if (puzzle == null) {
      return Response.notFound('Puzzle not found');
    }
    return Response.ok(
      jsonEncode(puzzle.toMap()),
      headers: {'content-type': 'application/json'},
    );
  }
} 