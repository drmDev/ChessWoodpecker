import { Chessground } from "https://cdnjs.cloudflare.com/ajax/libs/chessground/9.1.1/chessground.min.js";
import { Chess } from "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js";
import { soundManager } from './sounds.js';
import { MoveHandler, MOVE_DELAY } from './moves.js';
import { SessionStats } from './stats.js';
import { TimerManager } from './timer.js';
import { UIManager } from './ui.js';
import { SessionManager } from './sessionManager.js';

document.addEventListener("DOMContentLoaded", async function () {
    let currentPuzzleIndex = 0;
    let currentPuzzleData = null;
    let puzzleStartTime;
    let sessionStartTime = null;
    let game;
    let board;
    let dbPuzzles = [];
    let hintUsed = false;
    let category;
    let moveHandler;
    let puzzleTimes = [];
    const EXPECTED_PUZZLE_LENGTH = 200; // keep this updated
    const sessionStats = new SessionStats();
    const timerManager = new TimerManager();
    const uiManager = new UIManager();
    const sessionManager = new SessionManager();

    const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8081'
        : 'https://chesswoodpecker-production.up.railway.app';
    const apiUrl = `${baseUrl}/api/puzzles`;

    const BOARD_ELEMENT = document.getElementById("chessboard");

    document.getElementById('puzzle-container').style.display = 'block';
    uiManager.toggleSessionButtons(false);

    if (sessionManager.hasSession()) {
        // Remove any existing resume button first
        removeResumeButton();

        // Add a Resume Session button if there's a saved session
        const resumeButton = document.createElement('button');
        resumeButton.id = 'resumeSession';
        resumeButton.className = 'btn btn-success puzzle-btn';
        resumeButton.innerHTML = '<i class="fas fa-history"></i> Resume Session';
        resumeButton.addEventListener('click', resumeSession);

        // Add it after the start button
        const startButton = document.getElementById('startPuzzle');
        startButton.parentNode.insertBefore(resumeButton, startButton.nextSibling);
    }

    try {
        await fetchPuzzles();
        if (dbPuzzles && dbPuzzles.length === EXPECTED_PUZZLE_LENGTH) {
            console.log(`✅ ${EXPECTED_PUZZLE_LENGTH} Puzzles loaded successfully`);
        } else {
            throw new Error('Incomplete puzzle data');
        }
    } catch (error) {
        console.error('Error loading initial puzzles:', error);
    }

    // Modify the start puzzle button to save initial session
    document.getElementById("startPuzzle").addEventListener("click", async function () {
        try {
            if (!dbPuzzles || dbPuzzles.length === 0) {
                await fetchPuzzles();
            }

            console.log('Starting new puzzle session');

            // Initialize session start time
            sessionStartTime = Date.now();

            // Initialize session stats
            sessionStats.reset();

            // Show UI components
            uiManager.toggleSessionButtons(true);
            timerManager.start();

            // Save initial session state
            sessionManager.saveSession({
                currentPuzzleIndex: 0,
                totalTimeMs: 0,
                startTimestamp: sessionStartTime, // Add this line
                completedPuzzles: [],
                stats: sessionStats.stats,
                isComplete: false // Add this to track completion status
            });

            await loadPuzzle();

            // Update progress indicator
            uiManager.updateSessionProgress(1, dbPuzzles.length);

        } catch (error) {
            console.error('Error starting puzzle session:', error);
            uiManager.toggleSessionButtons(false);
        }
    });

    document.getElementById("stopPuzzle").addEventListener("click", function () {
        timerManager.stop();
        uiManager.setSessionPaused(true);
        uiManager.toggleSessionButtons(false);
        uiManager.hideHintButton();

        // Update final time in stats
        sessionStats.setTotalTime(timerManager.totalTime);

        // Save the session state with final time
        sessionManager.saveSession({
            currentPuzzleIndex: currentPuzzleIndex,
            totalTimeMs: timerManager.totalTime,
            startTimestamp: sessionStartTime,
            completedPuzzles: sessionStats.getCompletedPuzzleIds(),
            successfulPuzzles: sessionStats.getSuccessfulPuzzleIds(),
            failedPuzzles: sessionStats.getFailedPuzzleIds(),
            stats: sessionStats.stats,
            isComplete: false
        });

        // Clean up any duplicate resume buttons
        removeResumeButton();

        // Show the session summary
        uiManager.showSessionSummary(sessionStats, {
            onNewSession: async () => {
                resetSession();
                await loadPuzzle();
                timerManager.start();
                uiManager.toggleSessionButtons(true);
            }
        });
    });

    hintButton.addEventListener('click', function () {
        if (!currentPuzzleData || hintUsed) return;

        category = dbPuzzles[currentPuzzleIndex].category;
        uiManager.showHint(category);
        hintUsed = true;
    });

    // session restoration function
    async function resumeSession() {
        console.log('Resuming session');
        const savedSession = sessionManager.loadSession();
        if (savedSession) {
            // Restore session index and time
            currentPuzzleIndex = savedSession.currentPuzzleIndex || 0;
            sessionStartTime = savedSession.startTimestamp || Date.now();

            // Load saved stats if available
            if (savedSession.stats) {
                sessionStats.stats = savedSession.stats;
            }

            // Restore timer if available
            if (savedSession.totalTimeMs) {
                timerManager.totalTime = savedSession.totalTimeMs;
            }

            // Update UI with session progress
            uiManager.updateSessionProgress(currentPuzzleIndex + 1, dbPuzzles.length);

            // Update quick stats display
            uiManager.updateSessionStats(sessionStats);

            // Hide resume button while session is active
            uiManager.updateResumeButton(false);

            resetGameBoard();
            loadPuzzle();
            timerManager.start();
            uiManager.toggleSessionButtons(true);
        }
    }

    async function fetchPuzzles() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const puzzles = await response.json();

            // Validate puzzle data
            const isValid = await validatePuzzleData(puzzles);
            if (!isValid) {
                throw new Error('Puzzle validation failed');
            }

            dbPuzzles = puzzles;
            return true;
        } catch (error) {
            console.error("Error fetching puzzles from our database:", error);
            return false;
        }
    }

    async function convertUCIToSAN(uciMoves, initialFEN) {
        // Create a temporary chess game instance with the given position
        const tempGame = new Chess(initialFEN);

        // Convert each UCI move to SAN notation
        const sanMoves = uciMoves.map(uci => {
            // UCI format example: "e2e4" or "e7e8q" (for promotion)
            // slice(0,2) gets the 'from' square (e.g., "e2")
            // slice(2,4) gets the 'to' square (e.g., "e4")
            // uci[4] gets the promotion piece if it exists (e.g., "q" for queen)
            const move = tempGame.move({
                from: uci.slice(0, 2),
                to: uci.slice(2, 4),
                promotion: uci[4] || undefined
            }, {
                sloppy: true // Allows more flexible move parsing
            });

            return move ? move.san : null; // Remove any null moves that failed to convert
        }).filter(m => m);

        return sanMoves;
    }

    async function loadPuzzle() {
        if (!dbPuzzles || dbPuzzles.length === 0) {
            console.error('No puzzles loaded');
            return;
        }

        // Auto stop the session when all puzzles are done
        if (currentPuzzleIndex >= dbPuzzles.length) {
            timerManager.stop();
            uiManager.hideHintButton();
            sessionStats.setTotalTime(timerManager.totalTime);

            // Mark session as complete
            sessionManager.markSessionComplete();

            uiManager.showSessionSummary(sessionStats, {
                onNewSession: async () => {
                    resetSession();
                    await loadPuzzle();
                    timerManager.start();
                }
            });
            return;
        }

        // Rest of your existing loadPuzzle code
        uiManager.resetHint();
        hintUsed = false;
        uiManager.setPuzzleTitle(currentPuzzleIndex + 1);
        const puzzleMetadata = dbPuzzles[currentPuzzleIndex];

        try {
            currentPuzzleData = await fetchPuzzleData(puzzleMetadata.lichess_id);
            initializePuzzleState();
            await setupGamePosition();
            initializeChessboard();
            uiManager.updateTurnDisplay(game);

            console.log("✅ Puzzle loaded successfully", {
                isWhiteTurn: game.turn() === 'w',
                solution: currentPuzzleData.solutionSAN,
                fen: game.fen()
            });
        } catch (error) {
            console.error('Error loading puzzle:', error);
            currentPuzzleIndex++;
            await loadPuzzle();
        }

        sessionManager.saveSession({
            currentPuzzleIndex,
            totalTimeMs: timerManager.totalTime,
            completedPuzzles: sessionStats.getCompletedPuzzleIds(),
            stats: sessionStats.stats
        });
    }

    function removeResumeButton() {
        const existingResumeButton = document.getElementById('resumeSession');
        if (existingResumeButton) {
            existingResumeButton.remove();
        }
    }

    function resetSession() {
        console.log('Resetting session state');
        currentPuzzleIndex = 0;
        currentPuzzleData = null;
        hintUsed = false;
        puzzleTimes.length = 0;
        sessionStats.reset();
        timerManager.reset();
        uiManager.resetUI();
        sessionManager.clearSession();

        // Remove resume button when resetting the session
        removeResumeButton();
    }

    async function validatePuzzleData(puzzles) {
        // Check total count
        if (puzzles.length < EXPECTED_PUZZLE_LENGTH) {
            console.error(`Error: Expected ${EXPECTED_PUZZLE_LENGTH} puzzles but only received ${puzzles.length}`);
            return false;
        }

        // Check for unique IDs
        const puzzleIds = new Set();
        const duplicates = [];
        puzzles.forEach(puzzle => {
            if (puzzleIds.has(puzzle.lichess_id)) {
                duplicates.push(puzzle.lichess_id);
            }
            puzzleIds.add(puzzle.lichess_id);
        });

        if (duplicates.length > 0) {
            console.error(`Error: Found duplicate puzzle IDs: ${duplicates.join(', ')}`);
            return false;
        }

        return true;
    }

    async function fetchPuzzleData(lichessId) {
        const response = await fetch(`https://lichess.org/api/puzzle/${lichessId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    function initializePuzzleState() {
        puzzleStartTime = Date.now();
        uiManager.setPuzzleTitle(currentPuzzleIndex + 1);
        if (moveHandler) {
            moveHandler.stopAutoSolve();
        }
    }

    async function setupGamePosition() {
        const pgnMoves = currentPuzzleData.game.pgn.split(' ').filter(m => !/\d+\./.test(m));
        const initialPly = currentPuzzleData.puzzle.initialPly;

        game = new Chess();

        for (let i = 0; i < initialPly + 1; i++) {
            game.move(pgnMoves[i], { sloppy: true });
        }

        currentPuzzleData.solutionSAN = await convertUCIToSAN(
            currentPuzzleData.puzzle.solution,
            game.fen()
        );
    }

    function initializeChessboard() {
        const isWhiteTurn = game.turn() === 'w';

        board = Chessground(BOARD_ELEMENT, {
            fen: game.fen(),
            orientation: isWhiteTurn ? 'white' : 'black',
            turnColor: isWhiteTurn ? 'white' : 'black',
            movable: {
                free: false,
                color: isWhiteTurn ? 'white' : 'black',
                dests: new Map()  // Start with empty moves
            },
            highlight: {
                lastMove: true,
                check: true
            }
        });

        // Initialize moveHandler first
        moveHandler = new MoveHandler(game, board);

        // Now update the board with proper move destinations
        board.set({
            movable: {
                free: false,
                color: isWhiteTurn ? 'white' : 'black',
                dests: moveHandler.getLegalMoves(),
                events: {
                    after: (orig, dest) => {
                        moveHandler.onMove(orig, dest, currentPuzzleData, {
                            onSuccess: onPuzzleComplete,
                            onFailure: onPuzzleFailure,
                        });
                    }
                }
            }
        });
    }

    function onPuzzleComplete() {
        soundManager.playResultSound(true);
        const puzzleMetadata = dbPuzzles[currentPuzzleIndex];

        // Record in stats
        sessionStats.recordPuzzleAttempt(puzzleMetadata, true);

        // UI updates
        uiManager.logPuzzleCompletion(
            puzzleMetadata,
            currentPuzzleIndex,
            true,
            timerManager,
            puzzleStartTime
        );
        uiManager.updateTurnDisplay(game, true);

        // Save comprehensive session data
        sessionManager.saveSession({
            currentPuzzleIndex: currentPuzzleIndex + 1,
            totalTimeMs: timerManager.totalTime,
            startTimestamp: sessionStartTime,
            completedPuzzles: sessionStats.getCompletedPuzzleIds(),
            successfulPuzzles: sessionStats.getSuccessfulPuzzleIds(),
            failedPuzzles: sessionStats.getFailedPuzzleIds(),
            stats: sessionStats.stats,
            isComplete: (currentPuzzleIndex + 1 >= dbPuzzles.length)
        });

        // Check if session is complete
        if (currentPuzzleIndex + 1 >= dbPuzzles.length) {
            setTimeout(() => {
                timerManager.stop();
                uiManager.hideHintButton();
                sessionStats.setTotalTime(timerManager.totalTime);
                uiManager.showSessionSummary(sessionStats, {
                    onNewSession: async () => {
                        resetSession();
                        await loadPuzzle();
                        timerManager.start();
                    }
                });
            }, MOVE_DELAY);
        } else {
            setTimeout(loadNextPuzzle, MOVE_DELAY);
        }
    }

    function onPuzzleFailure() {
        const puzzleMetadata = dbPuzzles[currentPuzzleIndex];

        // Record in stats
        sessionStats.recordPuzzleAttempt(puzzleMetadata, false);

        // UI updates
        uiManager.hideHintButton();
        uiManager.logPuzzleCompletion(
            puzzleMetadata,
            currentPuzzleIndex,
            false,
            timerManager,
            puzzleStartTime
        );

        // Save comprehensive session data
        sessionManager.saveSession({
            currentPuzzleIndex: currentPuzzleIndex + 1,
            totalTimeMs: timerManager.totalTime,
            startTimestamp: sessionStartTime,
            completedPuzzles: sessionStats.getCompletedPuzzleIds(),
            successfulPuzzles: sessionStats.getSuccessfulPuzzleIds(),
            failedPuzzles: sessionStats.getFailedPuzzleIds(),
            stats: sessionStats.stats,
            isComplete: (currentPuzzleIndex + 1 >= dbPuzzles.length)
        });

        moveHandler.resetAndSolvePuzzle(currentPuzzleData, {
            onComplete: loadNextPuzzle,
            onUpdateDisplay: (isPuzzleComplete) => uiManager.updateTurnDisplay(game, isPuzzleComplete)
        });
    }

    function loadNextPuzzle() {
        currentPuzzleIndex++;
        loadPuzzle();
    }
});
