import '../models/puzzle.dart';
import '../repositories/puzzle_repository.dart';
import '../services/database_service.dart';

class PuzzleService {
  final PuzzleRepository _repository;
  List<Puzzle>? _puzzleSequence;
  int _currentPuzzleIndex = 0;

  PuzzleService(this._repository);

  // Default constructor for routes
  factory PuzzleService.defaultConstructor() {
    final database = DatabaseService.instance;
    final repository = PuzzleRepository(database);
    return PuzzleService(repository);
  }

  Future<List<Puzzle>> getAllPuzzles() async {
    return await _repository.getAllPuzzles();
  }

  Future<Puzzle?> getRandomPuzzle() async {
    return await _repository.getRandomPuzzle();
  }

  Future<Puzzle?> getPuzzleById(String id) async {
    return await _repository.getPuzzleById(id);
  }

  // Get next puzzle in sequence
  Future<Puzzle?> getNextPuzzle() async {
    if (_puzzleSequence == null) {
      _puzzleSequence = await getAllPuzzles();
      _currentPuzzleIndex = 0;
    }

    if (_currentPuzzleIndex >= _puzzleSequence!.length) {
      return null;
    }

    final puzzle = _puzzleSequence![_currentPuzzleIndex];
    _currentPuzzleIndex++;
    return puzzle;
  }

  // Reset puzzle sequence
  int resetPuzzleSequence() {
    _puzzleSequence = null;
    _currentPuzzleIndex = 0;
    return _puzzleSequence?.length ?? 0;
  }
}
