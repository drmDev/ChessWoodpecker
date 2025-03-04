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
exports.getPuzzleById = getPuzzleById;
// services/puzzleService.ts
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
/**
 * Retrieves a puzzle by ID from the cache or Lichess API
 * @param id The puzzle ID to retrieve
 * @returns The puzzle data or null if not found
 */
function getPuzzleById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Try to get from cache first
            const cachedPuzzle = yield prisma.lichessPuzzleCache.findUnique({
                where: { lichess_puzzle_id: id }
            });
            if (cachedPuzzle) {
                return cachedPuzzle;
            }
            // If not cached, fetch from Lichess API
            const apiPuzzle = yield fetchFromLichessApi(id);
            // Cache the puzzle data
            const newCachedPuzzle = yield prisma.lichessPuzzleCache.create({
                data: {
                    lichess_puzzle_id: id,
                    pgn: apiPuzzle.game.pgn,
                    initial_ply: apiPuzzle.puzzle.initialPly,
                    solution: apiPuzzle.puzzle.solution
                }
            });
            return newCachedPuzzle;
        }
        catch (error) {
            console.error(`Error retrieving puzzle ${id}:`, error.message);
            throw new Error(`Failed to retrieve puzzle: ${error.message}`);
        }
    });
}
/**
 * Fetches a puzzle from the Lichess API
 * @param id The puzzle ID to fetch
 * @returns The puzzle data from Lichess
 */
function fetchFromLichessApi(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`https://lichess.org/api/puzzle/${id}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching puzzle ${id} from Lichess API:`, error.message);
            throw new Error(`Failed to fetch puzzle from Lichess: ${error.message}`);
        }
    });
}
