import 'package:flutter/material.dart';
import 'package:chess/chess.dart' as chess;
import '../models/puzzle.dart';
import '../services/puzzle_service.dart';
import '../services/sound_service.dart';
import '../widgets/chess_board.dart';

class MainScreen extends StatefulWidget {
  final PuzzleService puzzleService;
  final SoundService soundService;

  const MainScreen({
    super.key,
    required this.puzzleService,
    required this.soundService,
  });

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
    print('MainScreen initialized');
    _loadNextPuzzle();
  }

  Future<void> _loadNextPuzzle() async {
    print('Loading next puzzle...');
    setState(() => _isLoading = true);

    // For testing, use a hardcoded puzzle ID
    // In production, this would come from a puzzle collection or API
    const testPuzzleId = 'test_puzzle_1';
    final puzzle = await widget.puzzleService.fetchPuzzle(testPuzzleId);
    print('Puzzle loaded: ${puzzle?.id}');

    setState(() {
      _currentPuzzle = puzzle;
      _currentMoveIndex = 0;
      _lastMoveFrom = null;
      _lastMoveTo = null;
      _isLoading = false;
    });
  }

  void _handleMove(String from, String to) {
    print('Move attempted: $from to $to');
    if (_currentPuzzle == null) return;

    final move = '$from$to';
    final isValid = widget.puzzleService.validateMove(
      _currentPuzzle!,
      move,
      _currentMoveIndex,
    );

    print('Move valid: $isValid');

    if (isValid) {
      setState(() {
        _lastMoveFrom = from;
        _lastMoveTo = to;
        _currentMoveIndex++;
      });

      // Play appropriate sound based on the move
      _playMoveSound(from, to);

      if (_currentMoveIndex >= _currentPuzzle!.solutionMoves.length) {
        _handlePuzzleComplete();
      }
    } else {
      _handlePuzzleFailure();
    }
  }

  void _playMoveSound(String from, String to) {
    // Check if it's a capture
    final targetPiece = _getPieceAtSquare(to);
    if (targetPiece != null) {
      widget.soundService.playSound('capture');
    } else {
      widget.soundService.playSound('move');
    }

    // For now, we'll skip check detection as it's not critical
    // and requires more complex logic with the chess package
  }

  chess.Piece? _getPieceAtSquare(String square) {
    if (_currentPuzzle == null) return null;

    final chessGame = chess.Chess();
    chessGame.load(_currentPuzzle!.fen);
    return chessGame.get(square);
  }

  Future<void> _handlePuzzleComplete() async {
    print('Puzzle completed!');
    if (_currentPuzzle != null) {
      await widget.puzzleService.markPuzzleCompleted(_currentPuzzle!.id);
      widget.soundService.playSound('success');
      // Show success message and load next puzzle
      _loadNextPuzzle();
    }
  }

  void _handlePuzzleFailure() {
    print('Puzzle failed!');
    // Show error message and reset puzzle
    widget.soundService.playSound('failure');
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
        actions: [
          IconButton(
            icon: Icon(widget.soundService.isMuted
                ? Icons.volume_off
                : Icons.volume_up),
            onPressed: () {
              print('Mute button pressed');
              setState(() {
                widget.soundService.toggleMute();
              });
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _currentPuzzle == null
              ? const Center(child: Text('No puzzle available'))
              : SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Text(
                          'Puzzle ${_currentPuzzle!.id}',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: Center(
                            child: AspectRatio(
                              aspectRatio: 1,
                              child: ChessBoard(
                                fen: _currentPuzzle!.fen,
                                isWhiteOrientation:
                                    _currentPuzzle!.isWhiteToMove,
                                onMove: _handleMove,
                                lastMoveFrom: _lastMoveFrom,
                                lastMoveTo: _lastMoveTo,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Move ${_currentMoveIndex + 1} of ${_currentPuzzle!.solutionMoves.length}',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            print('Reset button pressed');
                            setState(() {
                              _currentMoveIndex = 0;
                              _lastMoveFrom = null;
                              _lastMoveTo = null;
                            });
                          },
                          child: const Text('Reset Puzzle'),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
