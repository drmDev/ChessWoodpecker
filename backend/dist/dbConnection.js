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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function queryLichessPuzzleCache() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all entries from the lichess_puzzle_cache table
            const puzzles = yield prisma.lichessPuzzleCache.findMany();
            console.log("Table schema and entries:", puzzles);
        }
        catch (error) {
            console.error("Error querying the table:", error);
        }
        finally {
            yield prisma.$disconnect(); // Ensure the client is disconnected
        }
    });
}
// Example usage
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Call the query function to fetch data from the lichess_puzzle_cache table
        yield queryLichessPuzzleCache(); // Call the query function here
    }
    catch (error) {
        console.error("Error connecting to the database:", error);
    }
}))();
