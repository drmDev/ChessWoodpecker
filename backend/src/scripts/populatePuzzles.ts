import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Configuration
const LICHESS_API_BASE_URL = 'https://lichess.org/api/puzzle';
const BATCH_SIZE = 5; // Number of puzzles to fetch in parallel
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches to respect rate limits
const COLLECTION_PATH = '../apps/mobile/assets/puzzles/default-collection.json';

// Create a map to store puzzle themes
const puzzleThemeMap = new Map<string, string>();

/**
 * Builds a map of puzzle IDs to their themes from the collection
 * @param collectionData The puzzle collection data
 */
function buildPuzzleThemeMap(collectionData: Record<string, string[]>) {
    Object.entries(collectionData).forEach(([theme, puzzleIds]) => {
        puzzleIds.forEach(id => {
            puzzleThemeMap.set(id, theme);
        });
    });
    console.log(`Built theme map for ${puzzleThemeMap.size} puzzles`);
}

/**
 * Fetches a puzzle from Lichess API
 * @param id The puzzle ID to fetch
 * @returns The puzzle data or null if there was an error
 */
async function fetchPuzzleFromLichess(id: string) {
    try {
        console.log(`Fetching puzzle ${id} from Lichess API...`);
        const response = await axios.get(`${LICHESS_API_BASE_URL}/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching puzzle ${id}:`, error.message);
        return null;
    }
}

/**
 * Saves a puzzle to the database
 * @param puzzleData The puzzle data from Lichess API
 * @returns The saved puzzle or null if there was an error
 */
async function savePuzzleToDatabase(puzzleData: any) {
    try {
        const id = puzzleData.puzzle.id;
        
        // Get the theme for this puzzle
        const theme = puzzleThemeMap.get(id);
        if (!theme) {
            console.error(`No theme found for puzzle ${id}`);
            return null;
        }
        
        // Check if puzzle already exists
        const existingPuzzle = await prisma.lichessPuzzleCache.findUnique({
            where: { lichess_puzzle_id: id }
        });
        
        if (existingPuzzle) {
            console.log(`Puzzle ${id} already exists in database, skipping...`);
            return existingPuzzle;
        }
        
        // Save new puzzle
        const savedPuzzle = await prisma.lichessPuzzleCache.create({
            data: {
                lichess_puzzle_id: id,
                pgn: puzzleData.game.pgn,
                initial_ply: puzzleData.puzzle.initialPly,
                solution: puzzleData.puzzle.solution,
                theme: theme
            }
        });
        
        console.log(`Saved puzzle ${id} to database with theme ${theme}`);
        return savedPuzzle;
    } catch (error: any) {
        console.error(`Error saving puzzle to database:`, error);
        return null;
    }
}

/**
 * Processes puzzles in batches to respect rate limits
 * @param puzzleIds Array of puzzle IDs to process
 */
async function processPuzzlesInBatches(puzzleIds: string[]) {
    // Count total puzzles
    const totalPuzzles = puzzleIds.length;
    console.log(`Starting to process ${totalPuzzles} puzzles in batches of ${BATCH_SIZE}...`);
    
    let processedCount = 0;
    let successCount = 0;
    
    // Process in batches
    for (let i = 0; i < puzzleIds.length; i += BATCH_SIZE) {
        const batch = puzzleIds.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(puzzleIds.length/BATCH_SIZE)}...`);
        
        // Process batch in parallel
        const promises = batch.map(async (id) => {
            const puzzleData = await fetchPuzzleFromLichess(id);
            if (puzzleData) {
                const saved = await savePuzzleToDatabase(puzzleData);
                if (saved) successCount++;
            }
            processedCount++;
        });
        
        // Wait for all puzzles in batch to be processed
        await Promise.all(promises);
        
        // Progress update
        console.log(`Progress: ${processedCount}/${totalPuzzles} puzzles processed (${successCount} successful)`);
        
        // Delay before next batch to respect rate limits
        if (i + BATCH_SIZE < puzzleIds.length) {
            console.log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }
    
    return { total: totalPuzzles, processed: processedCount, successful: successCount };
}

/**
 * Main function to populate the database with puzzles
 */
async function populateDatabase() {
    try {
        // Read the collection file
        console.log(`Reading puzzle collection from ${COLLECTION_PATH}...`);
        
        const collectionData = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf8'));
        
        // Build the theme map first
        buildPuzzleThemeMap(collectionData);
        
        // Extract all puzzle IDs from all categories
        const allPuzzleIds: string[] = [];
        Object.values(collectionData).forEach((categoryPuzzles: any) => {
            allPuzzleIds.push(...categoryPuzzles);
        });
        
        // Remove duplicates if any
        const uniquePuzzleIds = [...new Set(allPuzzleIds)];
        console.log(`Found ${uniquePuzzleIds.length} unique puzzles across all categories`);
        
        // Process puzzles in batches
        const result = await processPuzzlesInBatches(uniquePuzzleIds);
        
        console.log(`Database population complete!`);
        console.log(`Total puzzles: ${result.total}`);
        console.log(`Successfully saved: ${result.successful}`);
        console.log(`Failed: ${result.total - result.successful}`);
    } catch (error: any) {
        console.error('Error populating database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the population script
populateDatabase()
    .then(() => console.log('Script execution complete'))
    .catch(error => console.error('Script execution failed:', error));