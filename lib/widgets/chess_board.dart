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
  double _squareSize = 0.0;

  @override
  void initState() {
    super.initState();
    _chess = chess.Chess();
    _loadPosition();
    _loadPieceImages();
  }

  @override
  void didUpdateWidget(covariant ChessBoard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.fen != oldWidget.fen) {
      _loadPosition();
    }
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
        final size = constraints.maxWidth;
        _squareSize = size / 8;

        return GestureDetector(
          onPanStart: _handleDragStart,
          onPanUpdate: _handleDragUpdate,
          onPanEnd: _handleDragEnd,
          child: Container(
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
                    return _buildSquare(file, rank);
                  },
                ),
                if (_draggedPiece != null && _dragPosition != null)
                  Positioned(
                    left: _dragPosition!.dx - _squareSize / 2,
                    top: _dragPosition!.dy - _squareSize / 2,
                    child: _buildDraggedPiece(_draggedPiece!, _squareSize),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSquare(int file, int rank) {
    final isBlack = (file + rank) % 2 == 1;
    final square = _getSquareName(file, rank);
    final piece = _chess.get(square);
    final isLastMoveFrom = square == widget.lastMoveFrom;
    final isLastMoveTo = square == widget.lastMoveTo;
    final isDragged = square == _dragStartSquare;

    return Container(
      width: _squareSize,
      height: _squareSize,
      color: _getSquareColor(isBlack, isLastMoveFrom, isLastMoveTo),
      child: Stack(
        children: [
          if (widget.showCoordinates) _buildCoordinates(file, rank),
          if (piece != null && !isDragged)
            Center(child: _buildPiece(piece, _squareSize)),
        ],
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
      return Text(
        _getPieceSymbol(piece.type),
        style: TextStyle(
          fontSize: squareSize * 0.75,
          color: piece.color == chess.Color.WHITE ? Colors.white : Colors.black,
        ),
      );
    }
    return RawImage(image: image, fit: BoxFit.contain);
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
    if (piece == null) return const SizedBox.shrink();
    return SizedBox(
      width: squareSize,
      height: squareSize,
      child: _buildPiece(piece, squareSize),
    );
  }

  Widget _buildCoordinates(int file, int rank) {
    final isBottomRank = rank == 7;
    final isLeftFile = file == 0;

    if (!isBottomRank && !isLeftFile) return const SizedBox.shrink();

    final rankName = (8 - rank).toString();
    final fileName = String.fromCharCode(97 + file);

    return Align(
      alignment: isBottomRank ? Alignment.bottomLeft : Alignment.topLeft,
      child: Padding(
        padding: const EdgeInsets.all(2.0),
        child: Text(
          isBottomRank ? fileName : (isLeftFile ? rankName : ''),
          style: TextStyle(
            color: (file + rank) % 2 == 1
                ? const Color(0xFFEEEED2)
                : const Color(0xFF769656),
            fontSize: _squareSize * 0.2,
          ),
        ),
      ),
    );
  }

  void _handleDragStart(DragStartDetails details) {
    final square = _getSquareFromOffset(details.localPosition);
    if (square == null) return;

    final piece = _chess.get(square);
    if (piece != null) {
      setState(() {
        _dragStartSquare = square;
        _draggedPiece = square;
        _dragPosition = details.localPosition;
      });
    }
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    if (_draggedPiece != null) {
      setState(() {
        _dragPosition = details.localPosition;
      });
    }
  }

  void _handleDragEnd(DragEndDetails details) {
    if (_dragStartSquare != null) {
      final targetSquare = _getSquareFromOffset(_dragPosition!);
      if (targetSquare != null && targetSquare != _dragStartSquare) {
        widget.onMove(_dragStartSquare!, targetSquare);
      }
    }
    setState(() {
      _draggedPiece = null;
      _dragStartSquare = null;
      _dragPosition = null;
    });
  }

  String _getSquareName(int file, int rank) {
    final files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    final ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    return files[file] + ranks[7 - rank];
  }

  String? _getSquareFromOffset(Offset offset) {
    if (_squareSize == 0) return null;
    final file = (offset.dx / _squareSize).floor();
    final rank = (offset.dy / _squareSize).floor();
    if (file < 0 || file >= 8 || rank < 0 || rank >= 8) {
      return null;
    }
    return _getSquareName(file, rank);
  }
}
