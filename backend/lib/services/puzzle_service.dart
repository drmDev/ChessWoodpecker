import '../models/puzzle.dart';
import '../repositories/puzzle_repository.dart';

class PuzzleService {
  final PuzzleRepository _repository;

  PuzzleService(this._repository);

  Future<List<Puzzle>> getAllPuzzles() async {
    return await _repository.getAllPuzzles();
  }

  Future<Puzzle?> getRandomPuzzle() async {
    return await _repository.getRandomPuzzle();
  }

  Future<Puzzle?> getPuzzleById(String id) async {
    return await _repository.getPuzzleById(id);
  }
} 