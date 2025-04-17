// services/puzzleService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Retrieves a puzzle by ID from our database
 * @param id The puzzle ID to retrieve
 * @returns The puzzle data or null if not found
 */
export async function getPuzzleById(id: string) {
    try {
        const puzzle = await prisma.lichessPuzzleCache.findUnique({
            where: { lichess_puzzle_id: id }
        });

        if (!puzzle) {
            throw new Error('Puzzle not found in database');
        }

        return puzzle;
    } catch (error: any) {
        console.error(`Error retrieving puzzle ${id}:`, error.message);
        throw new Error(`Failed to retrieve puzzle: ${error.message}`);
    }
}