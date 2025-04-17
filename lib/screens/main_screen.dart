import 'package:flutter/material.dart';
import 'package:chess/chess.dart' as chess;
import '../models/puzzle.dart';
import '../services/puzzle_service.dart';
import '../widgets/chess_board.dart';

class MainScreen extends StatefulWidget {
  final PuzzleService puzzleService;

  const MainScreen({
    Key? key,
    required this.puzzleService,
  }) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  Puzzle? _currentPuzzle;
  int _currentMoveIndex = 0;
  String? _lastMoveFrom;
  String? _lastMoveTo;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNextPuzzle();
  }

  Future<void> _loadNextPuzzle() async {
    setState(() => _isLoading = true);
    
    // For testing, use a hardcoded puzzle ID
    // In production, this would come from a puzzle collection or API
    const testPuzzleId = 'test_puzzle_1';
    final puzzle = await widget.puzzleService.fetchPuzzle(testPuzzleId);
    
    setState(() {
      _currentPuzzle = puzzle;
      _currentMoveIndex = 0;
      _lastMoveFrom = null;
      _lastMoveTo = null;
      _isLoading = false;
    });
  }

  void _handleMove(String from, String to) {
    if (_currentPuzzle == null) return;

    final move = '$from$to';
    final isValid = widget.puzzleService.validateMove(
      _currentPuzzle!,
      move,
      _currentMoveIndex,
    );

    if (isValid) {
      setState(() {
        _lastMoveFrom = from;
        _lastMoveTo = to;
        _currentMoveIndex++;
      });

      if (_currentMoveIndex >= _currentPuzzle!.solutionMoves.length) {
        _handlePuzzleComplete();
      }
    } else {
      _handlePuzzleFailure();
    }
  }

  Future<void> _handlePuzzleComplete() async {
    if (_currentPuzzle != null) {
      await widget.puzzleService.markPuzzleCompleted(_currentPuzzle!.id);
      // Show success message and load next puzzle
      _loadNextPuzzle();
    }
  }

  void _handlePuzzleFailure() {
    // Show error message and reset puzzle
    setState(() {
      _currentMoveIndex = 0;
      _lastMoveFrom = null;
      _lastMoveTo = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chess Woodpecker'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _currentPuzzle == null
              ? const Center(child: Text('No puzzle available'))
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Puzzle ${_currentPuzzle!.id}',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: ChessBoard(
                        fen: _currentPuzzle!.fen,
                        isWhiteOrientation: _currentPuzzle!.isWhiteToMove,
                        onMove: _handleMove,
                        lastMoveFrom: _lastMoveFrom,
                        lastMoveTo: _lastMoveTo,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Move ${_currentMoveIndex + 1} of ${_currentPuzzle!.solutionMoves.length}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
    );
  }
} 