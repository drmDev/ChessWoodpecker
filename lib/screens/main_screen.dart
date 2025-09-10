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
  String? _lastMoveFrom;
  String? _lastMoveTo;
  bool _isLoading = true;
  late String _currentFen;
  final bool _freePlayMode = true; // Set to true for free-play testing

  @override
  void initState() {
    super.initState();
    print('MainScreen initialized');
    _loadNextPuzzle();
  }

  Future<void> _loadNextPuzzle() async {
    print('Loading next puzzle...');
    setState(() => _isLoading = true);

    const testPuzzleId = 'test_puzzle_1';
    final puzzle = await widget.puzzleService.fetchPuzzle(testPuzzleId);
    print('Puzzle loaded: ${puzzle?.id}');

    setState(() {
      _currentPuzzle = puzzle;
      _currentFen = puzzle?.fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      _lastMoveFrom = null;
      _lastMoveTo = null;
      _isLoading = false;
    });
  }

  void _handleMove(String from, String to) {
    if (_freePlayMode) {
      _handleFreePlayMove(from, to);
    } else {
      _handlePuzzleMove(from, to);
    }
  }

  void _handleFreePlayMove(String from, String to) {
    final chessGame = chess.Chess.fromFEN(_currentFen);

    // Get all possible moves in a verbose format, which includes from/to squares.
    final possibleMoves = chessGame.moves({'verbose': true});

    // Find the specific move that matches the user's action.
    final matchedMove = possibleMoves.firstWhere(
      (move) => move['from'] == from && move['to'] == to,
      orElse: () => null,
    );

    if (matchedMove == null) {
      // The move is not in the list of legal moves.
      print('Invalid move: $from to $to is not in the list of possible moves.');
      widget.soundService.playSound('failure');
    } else {
      // The move is legal, execute it using its SAN representation.
      final sanMove = matchedMove['san'];
      print('Valid move found: $sanMove. Executing...');
      final moveResult = chessGame.move(sanMove);

      if (moveResult != null) {
        setState(() {
          _currentFen = chessGame.fen;
          _lastMoveFrom = from;
          _lastMoveTo = to;
        });
        //_playMoveSound(chessGame, moveResult);
      } else {
        // This should not happen if the logic is correct
        print('Error: Failed to execute a valid move.');
      }
    }
  }

  void _handlePuzzleMove(String from, String to) {
    print('Move attempted in puzzle mode: $from to $to');
    if (_currentPuzzle == null) return;

    final moveString = '$from$to';
    final isPuzzleMoveValid = widget.puzzleService.validateMove(
      _currentPuzzle!,
      moveString,
      0, // This needs to be dynamic in a real puzzle session
    );

    if (isPuzzleMoveValid) {
      final chessGame = chess.Chess.fromFEN(_currentFen);
      final moveResult = chessGame.move({'from': from, 'to': to, 'promotion': 'q'});

      // The chess.move method can return null or false for an invalid move.
      if (moveResult == null || moveResult is bool) {
        print('Error: Puzzle data and chess engine are out of sync.');
        _handlePuzzleFailure();
      } else {
        setState(() {
          _currentFen = chessGame.fen;
          _lastMoveFrom = from;
          _lastMoveTo = to;
        });
        // TODO: fix sounds on playing moves
        // Potentially check for puzzle completion here
      }
    } else {
      _handlePuzzleFailure();
    }
  }

  Future<void> _handlePuzzleComplete() async {
    print('Puzzle completed!');
    if (_currentPuzzle != null) {
      await widget.puzzleService.markPuzzleCompleted(_currentPuzzle!.id);
      widget.soundService.playSound('success');
      _loadNextPuzzle();
    }
  }

  void _handlePuzzleFailure() {
    print('Puzzle failed!');
    widget.soundService.playSound('failure');
    // In free-play, we don't reset the whole puzzle
    if (!_freePlayMode) {
      setState(() {
        _lastMoveFrom = null;
        _lastMoveTo = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_freePlayMode ? 'Free Play Mode' : 'Chess Woodpecker'),
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
                        if (!_freePlayMode)
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
                                fen: _currentFen,
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
                        if (!_freePlayMode)
                          Text(
                            'Move 1 of X', // Simplified for now
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadNextPuzzle,
                          child: const Text('Reset Board'),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
