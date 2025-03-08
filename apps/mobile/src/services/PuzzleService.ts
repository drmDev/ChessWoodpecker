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

  constructor() {
    this.baseUrl = BACKEND_URL;
  }

  /**
   * Fetches a random puzzle, checking cache first
   * @returns Processed puzzle data
   */
  async fetchRandomPuzzle(): Promise<Puzzle> {
    try {
      // Get all puzzle IDs from the collection
      const allPuzzleIds: string[] = [];
      Object.values(defaultCollection).forEach(ids => {
        allPuzzleIds.push(...(ids as string[]));
      });

      // Select a random puzzle ID
      const randomIndex = Math.floor(Math.random() * allPuzzleIds.length);
      const randomId = allPuzzleIds[randomIndex];

      // Check cache first
      const cachedPuzzle = await PuzzleCacheService.getPuzzle(randomId);
      if (cachedPuzzle) {
        return cachedPuzzle;
      }

      // If not in cache, fetch from backend
      const response = await fetch(`${this.baseUrl}/puzzles/${randomId}`);

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
    } catch (error: any) {
      console.error('[PuzzleService] Error fetching random puzzle:', error);
      throw new Error(`Failed to fetch puzzle: ${error.message}`);
    }
  }

  async fetchPuzzleById(id: string): Promise<Puzzle | null> {
    try {
      const cachedPuzzle = await PuzzleCacheService.getPuzzle(id);
      if (cachedPuzzle) {
        return cachedPuzzle;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch puzzle by ID:', error);
      return null;
    }
  }
}

export const puzzleService = new PuzzleService();