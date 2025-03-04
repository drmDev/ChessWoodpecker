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
// routes/puzzleRoutes.ts
const express_1 = __importDefault(require("express"));
const puzzleService_1 = require("../services/puzzleService");
const router = express_1.default.Router();
/**
 * GET /api/puzzles/:id
 * Retrieves a puzzle by ID from the cache or Lichess API
 */
router.get('/:id', function (req, res, next) {
    (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            // Validate puzzle ID format (Lichess puzzles are typically 5 characters)
            if (!id || id.length !== 5) {
                return res.status(400).json({
                    error: 'Invalid puzzle ID format',
                    message: 'Puzzle ID should be 5 characters long'
                });
            }
            const puzzle = yield (0, puzzleService_1.getPuzzleById)(id);
            res.json(puzzle);
        }
        catch (error) {
            console.error('Error in puzzle route:', error);
            // Handle specific error types
            if (error.message.includes('Failed to fetch puzzle from Lichess')) {
                return res.status(404).json({
                    error: 'Puzzle not found',
                    message: 'The requested puzzle could not be found on Lichess'
                });
            }
            // Generic error handling
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }))();
});
// Add more routes as needed
exports.default = router;
