# Backend Scripts

This directory contains utility scripts for the Chess Woodpecker backend.

## Puzzle Population Script

The `populatePuzzles.ts` script is used to populate the database with puzzles from the default collection. This is a one-time operation that fetches puzzles from the Lichess API and stores them in the local database.

### Usage

To run the script:

```bash
# Navigate to the backend directory
cd backend

# Compile and run the script
npx ts-node src/scripts/populatePuzzles.ts
```

### Configuration

The script has several configuration options at the top of the file:

- `LICHESS_API_BASE_URL`: The base URL for the Lichess API
- `BATCH_SIZE`: Number of puzzles to fetch in parallel (default: 5)
- `DELAY_BETWEEN_BATCHES`: Delay in milliseconds between batches to respect rate limits (default: 2000ms)
- `COLLECTION_PATH`: Path to the collection JSON file

### Rate Limiting

The script respects Lichess API rate limits by:

1. Processing puzzles in small batches (default: 5 at a time)
2. Adding a delay between batches (default: 2 seconds)

### Output

The script provides detailed logging of its progress, including:

- Total number of puzzles found
- Current batch being processed
- Progress updates
- Success/failure counts
- Completion summary

### Notes

- This script is designed to be run once to populate the database
- If a puzzle already exists in the database, it will be skipped
- The script handles errors gracefully and continues processing other puzzles if one fails 