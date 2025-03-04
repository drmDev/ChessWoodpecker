"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// Configuration
const LICHESS_API_BASE_URL = 'https://lichess.org/api/puzzle';
const BATCH_SIZE = 5; // Number of puzzles to fetch in parallel
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches to respect rate limits
const COLLECTION_PATH = '../../apps/mobile/assets/puzzles/default-collection.json';
/**
 * Fetches a puzzle from Lichess API
 * @param id The puzzle ID to fetch
 * @returns The puzzle data or null if there was an error
 */
function fetchPuzzleFromLichess(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Fetching puzzle ${id} from Lichess API...`);
            const response = yield axios_1.default.get(`${LICHESS_API_BASE_URL}/${id}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching puzzle ${id}:`, error.message);
            return null;
        }
    });
}
/**
 * Saves a puzzle to the database
 * @param puzzleData The puzzle data from Lichess API
 * @returns The saved puzzle or null if there was an error
 */
function savePuzzleToDatabase(puzzleData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = puzzleData.puzzle.id;
            // Check if puzzle already exists
            const existingPuzzle = yield prisma.lichessPuzzleCache.findUnique({
                where: { lichess_puzzle_id: id }
            });
            if (existingPuzzle) {
                console.log(`Puzzle ${id} already exists in database, skipping...`);
                return existingPuzzle;
            }
            // Save new puzzle
            const savedPuzzle = yield prisma.lichessPuzzleCache.create({
                data: {
                    lichess_puzzle_id: id,
                    pgn: puzzleData.game.pgn,
                    initial_ply: puzzleData.puzzle.initialPly,
                    solution: puzzleData.puzzle.solution
                }
            });
            console.log(`Saved puzzle ${id} to database`);
            return savedPuzzle;
        }
        catch (error) {
            console.error(`Error saving puzzle to database:`, error);
            return null;
        }
    });
}
/**
 * Processes puzzles in batches to respect rate limits
 * @param puzzleIds Array of puzzle IDs to process
 */
function processPuzzlesInBatches(puzzleIds) {
    return __awaiter(this, void 0, void 0, function* () {
        // Count total puzzles
        const totalPuzzles = puzzleIds.length;
        console.log(`Starting to process ${totalPuzzles} puzzles in batches of ${BATCH_SIZE}...`);
        let processedCount = 0;
        let successCount = 0;
        // Process in batches
        for (let i = 0; i < puzzleIds.length; i += BATCH_SIZE) {
            const batch = puzzleIds.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(puzzleIds.length / BATCH_SIZE)}...`);
            // Process batch in parallel
            const promises = batch.map((id) => __awaiter(this, void 0, void 0, function* () {
                const puzzleData = yield fetchPuzzleFromLichess(id);
                if (puzzleData) {
                    const saved = yield savePuzzleToDatabase(puzzleData);
                    if (saved)
                        successCount++;
                }
                processedCount++;
            }));
            // Wait for all puzzles in batch to be processed
            yield Promise.all(promises);
            // Progress update
            console.log(`Progress: ${processedCount}/${totalPuzzles} puzzles processed (${successCount} successful)`);
            // Delay before next batch to respect rate limits
            if (i + BATCH_SIZE < puzzleIds.length) {
                console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
                yield new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }
        return { total: totalPuzzles, processed: processedCount, successful: successCount };
    });
}
/**
 * Main function to populate the database with puzzles
 */
function populateDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read the collection file
            const collectionPath = path_1.default.resolve(__dirname, COLLECTION_PATH);
            console.log(`Reading puzzle collection from ${collectionPath}...`);
            const collectionData = JSON.parse(fs_1.default.readFileSync(collectionPath, 'utf8'));
            // Extract all puzzle IDs from all categories
            const allPuzzleIds = [];
            Object.values(collectionData).forEach((categoryPuzzles) => {
                allPuzzleIds.push(...categoryPuzzles);
            });
            // Remove duplicates if any
            const uniquePuzzleIds = [...new Set(allPuzzleIds)];
            console.log(`Found ${uniquePuzzleIds.length} unique puzzles across all categories`);
            // Process puzzles in batches
            const result = yield processPuzzlesInBatches(uniquePuzzleIds);
            console.log(`Database population complete!`);
            console.log(`Total puzzles: ${result.total}`);
            console.log(`Successfully saved: ${result.successful}`);
            console.log(`Failed: ${result.total - result.successful}`);
        }
        catch (error) {
            console.error('Error populating database:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Run the population script
populateDatabase()
    .then(() => console.log('Script execution complete'))
    .catch(error => console.error('Script execution failed:', error));
