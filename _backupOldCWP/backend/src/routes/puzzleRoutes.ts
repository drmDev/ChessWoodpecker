// routes/puzzleRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import { getPuzzleById } from '../services/puzzleService';

const router = express.Router();

/**
 * GET /api/puzzles/:id
 * Retrieves a puzzle by ID from the cache or Lichess API
 */
router.get('/:id', function(req: Request, res: Response, next: NextFunction) {
    (async () => {
        try {
            const id = req.params.id;
            
            // Validate puzzle ID format (Lichess puzzles are typically 5 characters)
            if (!id || id.length !== 5) {
                return res.status(400).json({ 
                    error: 'Invalid puzzle ID format',
                    message: 'Puzzle ID should be 5 characters long'
                });
            }
            
            const puzzle = await getPuzzleById(id);
            res.json(puzzle);
        } catch (error: any) {
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
    })();
});

// Add more routes as needed

export default router;