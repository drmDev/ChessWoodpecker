import React, { useState, useEffect } from 'react';
import ChessBoard from './components/chess/ChessBoard';
import { PuzzlesScreen } from '../../shared/screens/PuzzlesScreen';
import { ThemeProvider, useTheme } from '../../shared/contexts/ThemeContext';
import './App.css';

// Main app content with theme
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'puzzles'>('home');
  const { colors, mode, toggleTheme } = useTheme();

  // Apply theme to body
  useEffect(() => {
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }, [colors]);

  return (
    <div 
      className="app-container"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
      <header style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <div className="header-content">
          <h1 style={{ color: colors.text }}>Chess Woodpecker</h1>
          
          <nav>
            <ul className="nav-tabs">
              <li 
                className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
                style={{ 
                  backgroundColor: activeTab === 'home' ? colors.primary : colors.surface,
                  color: activeTab === 'home' ? '#fff' : colors.textSecondary,
                  borderColor: colors.border
                }}
              >
                <i className="material-icons">home</i>
                Home
              </li>
              <li 
                className={`nav-tab ${activeTab === 'puzzles' ? 'active' : ''}`}
                onClick={() => setActiveTab('puzzles')}
                style={{ 
                  backgroundColor: activeTab === 'puzzles' ? colors.primary : colors.surface,
                  color: activeTab === 'puzzles' ? '#fff' : colors.textSecondary,
                  borderColor: colors.border
                }}
              >
                <i className="material-icons">grid_view</i>
                Puzzles
              </li>
            </ul>
          </nav>
          
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            style={{ 
              backgroundColor: 'transparent',
              color: colors.primary
            }}
          >
            <i className="material-icons">{mode === 'dark' ? 'light_mode' : 'dark_mode'}</i>
          </button>
        </div>
      </header>

      <main style={{ backgroundColor: colors.background }}>
        {activeTab === 'home' ? (
          <div className="chessboard-container">
            <ChessBoard />
          </div>
        ) : (
          <div className="puzzles-container">
            <PuzzlesScreen />
          </div>
        )}
      </main>
    </div>
  );
};

// Root component with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App; 