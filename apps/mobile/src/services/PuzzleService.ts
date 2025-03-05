import { LichessPuzzleResponse, processPuzzleData, Puzzle } from '../models/PuzzleModel';

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
   * Fetches a random puzzle from the backend
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
      
      // Fetch the puzzle from our backend
      const response = await fetch(`${this.baseUrl}/puzzles/${randomId}`);
      
      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert backend response to Lichess format for processing
      const lichessFormat: LichessPuzzleResponse = {
        game: {
          id: data.lichess_puzzle_id,
          pgn: data.pgn,
          clock: null
        },
        puzzle: {
          id: data.lichess_puzzle_id,
          rating: 0, // We don't store this in our backend yet
          plays: 0,  // We don't store this in our backend yet
          solution: data.solution,
          initialPly: data.initial_ply,
          themes: [] // We don't store this in our backend yet
        }
      };
      
      // Process the puzzle data
      return processPuzzleData(lichessFormat);
    } catch (error: any) {
      console.error('Error fetching random puzzle:', error);
      throw new Error(`Failed to fetch puzzle: ${error.message}`);
    }
  }
}

export const puzzleService = new PuzzleService(); 