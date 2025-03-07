 DROP TABLE IF EXISTS Lichess_Puzzle_Cache;

CREATE TABLE Lichess_Puzzle_Cache (
    id SERIAL PRIMARY KEY,
    lichess_puzzle_id VARCHAR(5) NOT NULL,
    pgn TEXT NOT NULL,
    initial_ply INT NOT NULL,
    solution TEXT[] NOT NULL,
    theme VARCHAR(50) NOT NULL
);