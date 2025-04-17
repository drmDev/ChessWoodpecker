import 'package:flutter/material.dart';
import 'package:chess/chess.dart' as chess;
import 'dart:ui' as ui;
import 'package:flutter/services.dart';

class ChessBoard extends StatefulWidget {
  final String fen;
  final bool isWhiteOrientation;
  final Function(String from, String to) onMove;
  final bool showCoordinates;
  final String? lastMoveFrom;
  final String? lastMoveTo;

  const ChessBoard({
    super.key,
    required this.fen,
    this.isWhiteOrientation = true,
    required this.onMove,
    this.showCoordinates = true,
    this.lastMoveFrom,
    this.lastMoveTo,
  });

  @override
  State<ChessBoard> createState() => _ChessBoardState();
}

class _ChessBoardState extends State<ChessBoard> {
  late chess.Chess _chess;
  String? _draggedPiece;
  String? _dragStartSquare;
  final Map<String, ui.Image> _pieceImages = {};
  Offset? _dragPosition;
  final double _squareSize = 50.0; // Default square size

  @override
  void initState() {
    super.initState();
    _chess = chess.Chess();
    _loadPosition();
    _loadPieceImages();
  }

  void _loadPosition() {
    _chess.load(widget.fen);
  }

  Future<void> _loadPieceImages() async {
    final pieceTypes = ['p', 'n', 'b', 'r', 'q', 'k'];
    final colors = ['w', 'b'];

    for (final color in colors) {
      for (final type in pieceTypes) {
        final pieceKey = '$color$type';
        final assetPath = 'assets/pieces/$pieceKey.png';
        try {
          final data = await rootBundle.load(assetPath);
          final codec =
              await ui.instantiateImageCodec(data.buffer.asUint8List());
          final frame = await codec.getNextFrame();
          _pieceImages[pieceKey] = frame.image;
        } catch (e) {
          print('Error loading piece image: $e');
        }
      }
    }

    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Calculate the size based on the available width
        final size = constraints.maxWidth;
        final squareSize = size / 8;

        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.black),
          ),
          child: Stack(
            children: [
              GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 8,
                ),
                itemCount: 64,
                itemBuilder: (context, index) {
                  final file = index % 8;
                  final rank = index ~/ 8;
                  final square = _getSquareName(file, rank);
                  return _buildSquare(square, file, rank, squareSize);
                },
              ),
              if (_draggedPiece != null && _dragPosition != null)
                Positioned(
                  left: _dragPosition!.dx - squareSize / 2,
                  top: _dragPosition!.dy - squareSize / 2,
                  child: _buildDraggedPiece(_draggedPiece!, squareSize),
                ),
            ],
          ),
        );
      },
    );
  }

  String _getSquareName(int file, int rank) {
    final fileChar = String.fromCharCode(97 + file); // 'a' to 'h'
    final rankNum = 8 - rank; // 1 to 8
    return '$fileChar$rankNum';
  }

  Widget _buildSquare(String square, int file, int rank, double squareSize) {
    final isBlack = (file + rank) % 2 == 1;
    final piece = _chess.get(square);
    final isLastMoveFrom = square == widget.lastMoveFrom;
    final isLastMoveTo = square == widget.lastMoveTo;
    final isDragged = square == _dragStartSquare;

    return GestureDetector(
      onPanStart: (details) => _handleDragStart(square, details),
      onPanUpdate: (details) => _handleDragUpdate(details),
      onPanEnd: (details) => _handleDragEnd(details),
      child: Container(
        width: squareSize,
        height: squareSize,
        color: _getSquareColor(isBlack, isLastMoveFrom, isLastMoveTo),
        child: piece != null && !isDragged
            ? _buildPiece(piece, squareSize)
            : widget.showCoordinates
                ? _buildCoordinates(file, rank, squareSize)
                : null,
      ),
    );
  }

  Color _getSquareColor(bool isBlack, bool isLastMoveFrom, bool isLastMoveTo) {
    if (isLastMoveFrom || isLastMoveTo) {
      return const Color(0xFFF7F769); // Highlight color for last move
    }
    return isBlack ? const Color(0xFF769656) : const Color(0xFFEEEED2);
  }

  Widget _buildPiece(chess.Piece piece, double squareSize) {
    final pieceKey = '${_getColorString(piece.color)}${piece.type}';
    final image = _pieceImages[pieceKey];

    if (image == null) {
      // Return a placeholder instead of throwing an exception
      return Container(
        width: squareSize,
        height: squareSize,
        decoration: BoxDecoration(
          color: piece.color == chess.Color.WHITE ? Colors.white : Colors.black,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            _getPieceSymbol(piece.type),
            style: TextStyle(
              color: piece.color == chess.Color.WHITE
                  ? Colors.black
                  : Colors.white,
              fontSize: squareSize * 0.5,
            ),
          ),
        ),
      );
    }

    return RawImage(
      image: image,
      fit: BoxFit.contain,
    );
  }

  String _getColorString(chess.Color color) {
    return color == chess.Color.WHITE ? 'w' : 'b';
  }

  String _getPieceSymbol(chess.PieceType type) {
    switch (type) {
      case chess.PieceType.KING:
        return '♔';
      case chess.PieceType.QUEEN:
        return '♕';
      case chess.PieceType.ROOK:
        return '♖';
      case chess.PieceType.BISHOP:
        return '♗';
      case chess.PieceType.KNIGHT:
        return '♘';
      case chess.PieceType.PAWN:
        return '♙';
      default:
        return '?';
    }
  }

  Widget _buildDraggedPiece(String square, double squareSize) {
    final piece = _chess.get(square);
    if (piece == null) return const SizedBox();

    return SizedBox(
      width: squareSize,
      height: squareSize,
      child: _buildPiece(piece, squareSize),
    );
  }

  Widget _buildCoordinates(int file, int rank, double squareSize) {
    if (!widget.showCoordinates) return const SizedBox();

    final isBottomRank = rank == 7;
    final isLeftFile = file == 0;

    if (!isBottomRank && !isLeftFile) return const SizedBox();

    String text = '';
    if (isBottomRank) {
      text = String.fromCharCode(97 + file); // 'a' to 'h'
    } else if (isLeftFile) {
      text = (8 - rank).toString(); // '1' to '8'
    }

    return Align(
      alignment: isBottomRank ? Alignment.bottomCenter : Alignment.centerLeft,
      child: Padding(
        padding: EdgeInsets.all(squareSize * 0.05),
        child: Text(
          text,
          style: TextStyle(
            color: (file + rank) % 2 == 1 ? Colors.white : Colors.black,
            fontSize: squareSize * 0.2,
          ),
        ),
      ),
    );
  }

  void _handleDragStart(String square, DragStartDetails details) {
    print('Drag start on square: $square');
    final piece = _chess.get(square);
    if (piece != null) {
      setState(() {
        _draggedPiece = square;
        _dragStartSquare = square;
        _dragPosition = details.localPosition;
      });
      print('Started dragging piece: ${piece.type} from $square');
    }
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    if (_draggedPiece != null) {
      setState(() {
        _dragPosition = _dragPosition! + details.delta;
      });
    }
  }

  void _handleDragEnd(DragEndDetails details) {
    print(
        'Drag end, dragged piece: $_draggedPiece, start square: $_dragStartSquare');
    if (_draggedPiece != null && _dragStartSquare != null) {
      final targetSquare = _getTargetSquare(details);
      print('Target square: $targetSquare');
      if (targetSquare != null) {
        print('Calling onMove with $_dragStartSquare to $targetSquare');
        widget.onMove(_dragStartSquare!, targetSquare);
      }
    }
    setState(() {
      _draggedPiece = null;
      _dragStartSquare = null;
      _dragPosition = null;
    });
  }

  String? _getTargetSquare(DragEndDetails details) {
    if (_dragPosition == null) return null;

    // Use the current drag position instead of velocity
    final file = (_dragPosition!.dx / _squareSize).floor();
    final rank = (_dragPosition!.dy / _squareSize).floor();

    // Check if the position is within the board
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      return _getSquareName(file, rank);
    }

    return null;
  }
}
