// src/services/PuzzleService.ts

import { extractMoveComponents } from '../utils/chess/PuzzleLogic';
import { Puzzle, getPuzzlePosition, convertUciToSan } from '../models/PuzzleModel';
import { PuzzleCacheService } from './PuzzleCacheService';
import { Chess } from 'chess.js';

// Load the default collection JSON
const defaultCollection = require('../../assets/puzzles/default-collection.json');

// Backend API URL
const BACKEND_URL = 'https://chesswoodpecker-production-8791.up.railway.app/api';

class PuzzleService {
  private baseUrl: string;
  private sessionPuzzleQueue: string[] = [];
  private MAX_SESSION_PUZZLES = 200;

  constructor() {
    this.baseUrl = BACKEND_URL;
  }

  /**
   * Initializes a new session with a randomized queue of puzzle IDs
   * @returns The number of puzzles in the queue
   */
  initializeSession(): number {
    // Get all puzzle IDs from the collection
    const allPuzzleIds: string[] = [];
    Object.values(defaultCollection).forEach(ids => {
      allPuzzleIds.push(...(ids as string[]));
    });

    // Shuffle the puzzle IDs using Fisher-Yates algorithm
    const shuffledIds = [...allPuzzleIds];
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }

    // Take only the first MAX_SESSION_PUZZLES puzzles
    this.sessionPuzzleQueue = shuffledIds.slice(0, this.MAX_SESSION_PUZZLES);
    
    return this.sessionPuzzleQueue.length;
  }

  /**
   * Gets the next puzzle from the session queue
   * @returns Processed puzzle data or null if queue is empty
   */
  async getNextSessionPuzzle(): Promise<Puzzle | null> {
    // If queue is empty, return null
    if (this.sessionPuzzleQueue.length === 0) {
      return null;
    }

    // Get the next puzzle ID from the queue
    const nextPuzzleId = this.sessionPuzzleQueue.shift();
    
    if (!nextPuzzleId) {
      return null;
    }

    // Try to get the puzzle from cache or fetch it
    try {
      const puzzle = await this.fetchPuzzleById(nextPuzzleId, false);
      return puzzle;
    } catch (error) {
      console.error(`Failed to fetch puzzle ${nextPuzzleId} for session:`, error);
      // If we fail to fetch a puzzle, try to get the next one
      return this.getNextSessionPuzzle();
    }
  }

  /**
   * Fetches a puzzle by ID, checking cache first
   * @param id The puzzle ID to fetch
   * @param throwError Whether to throw errors (true) or return null (false)
   * @returns Processed puzzle data or null if not found
   */
  async fetchPuzzleById(id: string, throwError: boolean = false): Promise<Puzzle | null> {
    try {
      // Check cache first
      const cachedPuzzle = await PuzzleCacheService.getPuzzle(id);
      if (cachedPuzzle) {
        return cachedPuzzle;
      }

      // If not in cache, fetch from backend
      const response = await fetch(`${this.baseUrl}/puzzles/${id}`);

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      const data = await response.json();

      // Process the puzzle data with only essential information
      const position = getPuzzlePosition(data.pgn, data.initial_ply);

      // Add null check for position
      if (!position) {
        throw new Error('Failed to get puzzle position');
      }

      const { fen, isWhiteToMove } = position;
      const chess = new Chess(fen);

      const puzzle: Puzzle = {
        id: data.lichess_puzzle_id,
        pgn: data.pgn,
        initialPly: data.initial_ply,
        theme: data.theme || 'Uncategorized',
        solutionMovesUCI: data.solution,
        solutionMovesSAN: data.solution.map((move: string) => {
          const san = convertUciToSan(chess, move);
          if (san) {
            // Make the move to update position for next conversion
            try {
              const { from, to, promotion } = extractMoveComponents(move);
              chess.move({ from, to, promotion });
            } catch (error) {
              console.error('Error extracting move components:', error);
            }
          }
          return san || move; // Fallback to UCI if conversion fails
        }),
        fen,
        isWhiteToMove,
        attempts: 0
      };

      await PuzzleCacheService.storePuzzle(puzzle);

      return puzzle;
    } catch (error) {
      console.error('Failed to fetch puzzle by ID:', error);
      if (throwError) {
        throw error; // Re-throw the error if throwError is true
      }
      return null;
    }
  }

  /**
   * Gets the remaining number of puzzles in the session queue
   * @returns The number of puzzles remaining
   */
  getRemainingPuzzleCount(): number {
    return this.sessionPuzzleQueue.length;
  }

  /**
   * Clears the current session puzzle queue
   */
  clearSession(): void {
    this.sessionPuzzleQueue = [];
  }
}

export const puzzleService = new PuzzleService();