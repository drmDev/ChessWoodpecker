import { Chess } from "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js";
import { soundManager } from './sounds.js';

const SQUARES = [
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
];

export const MOVE_DELAY = 2000;

export class MoveHandler {
    constructor(game, board) {
        this.game = game;
        this.board = board;
        this.autoSolveTimeout = null;
        this.currentSolutionIndex = 0;
    }

    updateBoardState(fen, lastMove = null, allowMoves = true) {
        const isWhiteTurn = this.game.turn() === 'w';
        const boardConfig = {
            fen: fen,
            turnColor: isWhiteTurn ? 'white' : 'black',
            movable: {
                color: allowMoves ? (isWhiteTurn ? 'white' : 'black') : null,
                dests: allowMoves ? this.getLegalMoves() : null
            }
        };

        if (lastMove) {
            boardConfig.lastMove = lastMove;
        }

        this.board.set(boardConfig);
    }

    getLegalMoves() {
        const dests = new Map();
        const currentTurn = this.game.turn();

        SQUARES.forEach(square => {
            const piece = this.game.get(square);
            if (piece && piece.color === currentTurn) {
                const moves = this.game.moves({
                    square,
                    verbose: true,
                    color: currentTurn
                });
                if (moves.length) {
                    dests.set(square, moves.map(m => m.to));
                }
            }
        });
        return dests;
    }

    onMove(orig, dest, currentPuzzleData, callbacks) {
        const move = this.game.move({
            from: orig,
            to: dest,
            promotion: "q"
        });

        if (!move) {
            return;
        }

        soundManager.playChessSound(move, this.game);

        const expectedMove = currentPuzzleData.solutionSAN[this.currentSolutionIndex];

        if (move.san !== expectedMove) {
            soundManager.playResultSound(false);
            const failMessage = document.getElementById("failMessage");
            failMessage.style.display = "block";

            setTimeout(() => {
                failMessage.style.display = "none";
                callbacks.onFailure();
            }, MOVE_DELAY);

            return;
        }

        this.updateBoardState(this.game.fen(), [orig, dest]);
        this.currentSolutionIndex++;

        if (this.currentSolutionIndex >= currentPuzzleData.solutionSAN.length) {
            callbacks.onSuccess();
        } else {
            setTimeout(() => this.aiMove(currentPuzzleData, callbacks), 500);
        }
    }

    aiMove(currentPuzzleData, callbacks) {
        if (!currentPuzzleData || this.currentSolutionIndex >= currentPuzzleData.solutionSAN.length) {
            return;
        }

        const nextMoveSAN = currentPuzzleData.solutionSAN[this.currentSolutionIndex];
        const move = this.game.move(nextMoveSAN);

        if (!move) {
            return;
        }

        soundManager.playChessSound(move, this.game);

        this.updateBoardState(this.game.fen(), [move.from, move.to]);
        this.currentSolutionIndex++;
    }

    resetState() {
        this.currentSolutionIndex = 0;
        this.stopAutoSolve();
    }

    resetAndSolvePuzzle(currentPuzzleData, callbacks) {
        this.game = new Chess();
        // transforms the pgn data by removing the move numbers and splitting into an array
        const pgnMoves = currentPuzzleData.game.pgn.split(" ").filter(m => !/\d+\./.test(m));
        const initialPly = currentPuzzleData.puzzle.initialPly;

        for (let i = 0; i < initialPly + 1; i++) {
            this.game.move(pgnMoves[i], { sloppy: true });
        }

        this.updateBoardState(this.game.fen(), [], false);
        this.currentSolutionIndex = 0;

        this.playSolutionAutomatically(currentPuzzleData, {
            onComplete: callbacks.onComplete,
            onUpdateDisplay: callbacks.onUpdateDisplay
        });
    }

    playSolutionAutomatically(currentPuzzleData, callbacks) {
        if (this.currentSolutionIndex >= currentPuzzleData.solutionSAN.length) {
            if (callbacks.onUpdateDisplay) {
                callbacks.onUpdateDisplay(true);
            }

            this.autoSolveTimeout = setTimeout(() => {
                if (callbacks.onComplete) {
                    callbacks.onComplete();
                }
            }, MOVE_DELAY);
            return;
        }

        const nextMoveSAN = currentPuzzleData.solutionSAN[this.currentSolutionIndex];
        const move = this.game.move(nextMoveSAN);
        if (!move) {
            return;
        }
        soundManager.playChessSound(move, this.game);

        this.updateBoardState(this.game.fen(), [move.from, move.to], false);

        this.currentSolutionIndex++;
        this.autoSolveTimeout = setTimeout(
            () => this.playSolutionAutomatically(currentPuzzleData, callbacks),
            MOVE_DELAY
        );
    }

    stopAutoSolve() {
        if (this.autoSolveTimeout) {
            clearTimeout(this.autoSolveTimeout);
            this.autoSolveTimeout = null;
        }
    }
}