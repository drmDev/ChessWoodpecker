// services/puzzleService.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * Retrieves a puzzle by ID from the cache or Lichess API
 * @param id The puzzle ID to retrieve
 * @returns The puzzle data or null if not found
 */
export async function getPuzzleById(id: string) {
    try {
        // Try to get from cache first
        const cachedPuzzle = await prisma.lichessPuzzleCache.findUnique({
            where: { lichess_puzzle_id: id }
        });

        if (cachedPuzzle) {
            return cachedPuzzle;
        }

        // If not cached, fetch from Lichess API
        const apiPuzzle = await fetchFromLichessApi(id);

        // Cache the puzzle data
        const newCachedPuzzle = await prisma.lichessPuzzleCache.create({
            data: {
                lichess_puzzle_id: id,
                pgn: apiPuzzle.game.pgn,
                initial_ply: apiPuzzle.puzzle.initialPly,
                solution: apiPuzzle.puzzle.solution
            }
        });

        return newCachedPuzzle;
    } catch (error: any) {
        console.error(`Error retrieving puzzle ${id}:`, error.message);
        throw new Error(`Failed to retrieve puzzle: ${error.message}`);
    }
}

/**
 * Fetches a puzzle from the Lichess API
 * @param id The puzzle ID to fetch
 * @returns The puzzle data from Lichess
 */
async function fetchFromLichessApi(id: string) {
    try {
        const response = await axios.get(`https://lichess.org/api/puzzle/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching puzzle ${id} from Lichess API:`, error.message);
        throw new Error(`Failed to fetch puzzle from Lichess: ${error.message}`);
    }
}