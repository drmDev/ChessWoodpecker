import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function queryLichessPuzzleCache() {
    try {
        // Fetch all entries from the lichess_puzzle_cache table
        const puzzles = await prisma.lichessPuzzleCache.findMany();
        console.log("Table schema and entries:", puzzles);
    } catch (error) {
        console.error("Error querying the table:", error);
    } finally {
        await prisma.$disconnect(); // Ensure the client is disconnected
    }
}

// Example usage
(async () => {
    try {
        // Call the query function to fetch data from the lichess_puzzle_cache table
        await queryLichessPuzzleCache(); // Call the query function here
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
})();