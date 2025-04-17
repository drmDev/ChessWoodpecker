import 'package:flutter/material.dart';
import 'package:chess/chess.dart' as chess;
import 'dart:ui' as ui;

class ChessBoard extends StatefulWidget {
  final String fen;
  final bool isWhiteOrientation;
  final Function(String from, String to) onMove;
  final bool showCoordinates;
  final String? lastMoveFrom;
  final String? lastMoveTo;

  const ChessBoard({
    Key? key,
    required this.fen,
    this.isWhiteOrientation = true,
    required this.onMove,
    this.showCoordinates = true,
    this.lastMoveFrom,
    this.lastMoveTo,
  }) : super(key: key);

  @override
  State<ChessBoard> createState() => _ChessBoardState();
}

class _ChessBoardState extends State<ChessBoard> {
  late chess.Chess _chess;
  String? _draggedPiece;
  String? _dragStartSquare;
  final Map<String, ui.Image> _pieceImages = {};

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
    // TODO: Load piece images from assets
    // This will be implemented when we add the assets
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1,
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black),
        ),
        child: GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 8,
          ),
          itemCount: 64,
          itemBuilder: (context, index) {
            final file = index % 8;
            final rank = index ~/ 8;
            final square = _getSquareName(file, rank);
            return _buildSquare(square, file, rank);
          },
        ),
      ),
    );
  }

  String _getSquareName(int file, int rank) {
    final fileChar = String.fromCharCode(97 + file); // 'a' to 'h'
    final rankNum = 8 - rank; // 1 to 8
    return '$fileChar$rankNum';
  }

  Widget _buildSquare(String square, int file, int rank) {
    final isBlack = (file + rank) % 2 == 1;
    final piece = _chess.get(square);
    final isLastMoveFrom = square == widget.lastMoveFrom;
    final isLastMoveTo = square == widget.lastMoveTo;

    return GestureDetector(
      onPanStart: (details) => _handleDragStart(square, details),
      onPanUpdate: (details) => _handleDragUpdate(details),
      onPanEnd: (details) => _handleDragEnd(details),
      child: Container(
        color: _getSquareColor(isBlack, isLastMoveFrom, isLastMoveTo),
        child: piece != null
            ? _buildPiece(piece)
            : widget.showCoordinates
                ? _buildCoordinates(file, rank)
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

  Widget _buildPiece(chess.Piece piece) {
    // TODO: Implement piece rendering with images
    return Center(
      child: Text(
        _getPieceSymbol(piece),
        style: TextStyle(
          color: piece.color == 'w' ? Colors.white : Colors.black,
          fontSize: 24,
        ),
      ),
    );
  }

  String _getPieceSymbol(chess.Piece piece) {
    const symbols = {
      'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    };
    return symbols[piece.type] ?? '';
  }

  Widget _buildCoordinates(int file, int rank) {
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
      alignment: isBottomRank
          ? Alignment.bottomCenter
          : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.all(2.0),
        child: Text(
          text,
          style: TextStyle(
            color: (file + rank) % 2 == 1 ? Colors.white : Colors.black,
            fontSize: 10,
          ),
        ),
      ),
    );
  }

  void _handleDragStart(String square, DragStartDetails details) {
    final piece = _chess.get(square);
    if (piece != null) {
      setState(() {
        _draggedPiece = square;
        _dragStartSquare = square;
      });
    }
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    // TODO: Implement piece dragging animation
  }

  void _handleDragEnd(DragEndDetails details) {
    if (_draggedPiece != null && _dragStartSquare != null) {
      final targetSquare = _getTargetSquare(details);
      if (targetSquare != null) {
        widget.onMove(_dragStartSquare!, targetSquare);
      }
    }
    setState(() {
      _draggedPiece = null;
      _dragStartSquare = null;
    });
  }

  String? _getTargetSquare(DragEndDetails details) {
    // TODO: Implement target square calculation based on drag position
    return null;
  }
} 