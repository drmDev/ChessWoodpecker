import 'dart:io';
import 'package:shelf/shelf_io.dart' as io;
import 'package:chess_woodpecker_backend/controllers/puzzle_controller.dart';
import 'package:chess_woodpecker_backend/services/puzzle_service.dart';
import 'package:chess_woodpecker_backend/services/session_service.dart';
import 'package:chess_woodpecker_backend/repositories/puzzle_repository.dart';
import 'package:chess_woodpecker_backend/services/database_service.dart';

void main(List<String> args) async {
  // Initialize services
  final databaseService = DatabaseService.instance;
  await databaseService.connect();

  // Initialize repository
  final puzzleRepository = PuzzleRepository(databaseService);

  // Initialize service
  final puzzleService = PuzzleService(puzzleRepository);

  // Initialize session service
  final sessionService = SessionService(puzzleRepository);

  // Initialize controller
  final puzzleController = PuzzleController(puzzleService, sessionService);

  // Create the server
  final handler = puzzleController.handler;
  final server = await io.serve(handler, InternetAddress.anyIPv4, 8080);

  print('Server listening on port ${server.port}');
}
