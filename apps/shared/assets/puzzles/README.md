# Chess Woodpecker Puzzle System

This directory contains the default puzzle collection for the Chess Woodpecker app. The puzzles are organized by tactical themes and are sourced from Lichess.org.

## File Structure

- `default-collection.json`: The default collection of 200 curated puzzles organized by categories
- Custom user collections can be imported and will be stored in the app's local storage

## Puzzle Collection Format

The puzzle collections are stored in JSON format with the following structure:

```json
{
  "version": "1.0",
  "name": "Optional collection name",
  "categories": [
    {
      "name": "Category Name",
      "puzzles": [
        { "id": "puzzleId1" },
        { "id": "puzzleId2" }
      ]
    }
  ]
}
```

## User Import Format

Users can import their own puzzle collections using a simple text format:

```
CATEGORY NAME
https://lichess.org/training/puzzleId1
https://lichess.org/training/puzzleId2

ANOTHER CATEGORY
https://lichess.org/training/puzzleId3
```

## Puzzle Data

The actual puzzle data is fetched from the Lichess API and cached locally. Each puzzle contains:

- PGN: The game moves leading up to the puzzle position
- Initial ply: The move number where the puzzle starts
- Solution: The sequence of correct moves in UCI format

## Lichess API

Puzzles are fetched from the Lichess API using the endpoint:
`https://lichess.org/api/puzzle/{puzzleId}`

## Adding New Puzzles

To add new puzzles to the default collection:

1. Find puzzles on Lichess.org
2. Extract the puzzle IDs from the URLs
3. Add them to the appropriate category in the default-collection.json file
4. Or create a new category if needed

## License

The puzzle data is sourced from Lichess.org and is available under the terms of the AGPL-3.0 license. 