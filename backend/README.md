# Chess Woodpecker Backend

A Dart-based backend service for the Chess Woodpecker application, providing puzzle management and solution verification functionality.

## Features

- Random puzzle retrieval
- Puzzle retrieval by ID
- Solution verification
- Puzzle attempt tracking
- PostgreSQL database integration

## Prerequisites

- Dart SDK (2.12.0 or higher)
- Dart dependencies (managed via pub.dev)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   dart pub get
   ```

## Configuration

The application uses the following environment variables:

- `DATABASE_PUBLIC_URL`: PostgreSQL connection string (default: postgresql://localhost:5432/chess_woodpecker)
- `PORT`: Server port (default: 8080)

## Running the Server

```bash
dart run bin/server.dart
```

## API Endpoints

### GET /puzzles/random
Returns a random puzzle from the database.

### GET /puzzles/:id
Returns a specific puzzle by ID.

### POST /puzzles/:id/verify
Verifies a solution attempt for a puzzle.

Request body:
```json
{
  "solution": ["e2e4", "e7e5", "g1f3"]
}
```

Response:
```json
{
  "correct": true,
  "message": "Solution is correct!"
}
```

## Project Structure

```
lib/
  ├── controllers/     # HTTP request handlers
  ├── services/        # Business logic
  ├── repositories/    # Data access layer
  ├── models/          # Data models
  └── database/        # Database configuration and migrations
```

## Testing

Run tests using:
```bash
dart test
```

## License

MIT License
