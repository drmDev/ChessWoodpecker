import React from 'react';
import ChessBoard from './components/chess/ChessBoard';

function App() {
  return (
    <div className="app-container">
      <h1>Chess Woodpecker</h1>
      <div className="chessboard-container">
        <ChessBoard />
      </div>
    </div>
  );
}

export default App; 