# Chess Woodpecker - Mobile App

Chess Woodpecker is a mobile application designed for chess training using the "Woodpecker Method," which involves solving the same chess puzzles repeatedly to improve pattern recognition and calculation skills.

## Project Overview

This React Native application built with Expo provides a mobile interface for chess puzzle training. It features a chess board, puzzle solving functionality, session tracking, and performance statistics.

## Technology Stack

### Core Technologies

- **TypeScript**: Strongly-typed programming language that builds on JavaScript
- **React Native**: Framework for building native mobile applications using React
- **Expo**: Platform for making universal React applications that run on Android, iOS, and the web

### State Management

- **React Context API**: Used for global state management through `AppStateContext` and `ThemeContext`
- **useReducer**: Implements Redux-like state management patterns for complex state logic

### UI Components and Styling

- **React Native Components**: Core UI building blocks
- **Expo Vector Icons**: Icon library for the application
- **React Native Gesture Handler**: Provides native-driven gesture management
- **React Native Reanimated**: Library for creating fluid animations
- **React Native Safe Area Context**: Manages safe area insets

### Chess-specific Libraries

- **chess.js**: JavaScript chess library that handles chess logic, move validation, etc.
- **react-native-chessboard**: Provides the interactive chessboard component

### Navigation

- **React Navigation**: Handles screen navigation with bottom tabs
- **React Native Screens**: Improves navigation performance

### Storage and Data Management

- **AsyncStorage**: Persistent, key-value storage system for React Native
- **Expo Asset**: Manages assets like images and sounds

### Audio

- **Expo AV**: Provides audio playback functionality for move sounds and notifications

### Testing

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Testing utilities for React Native

## Project Structure

```
apps/mobile/
├── assets/                  # Static assets (images, sounds)
│   └── sounds/              # Sound effects for chess moves
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── chess/           # Chess-related components
│   │   │   └── ChessBoard.tsx  # Chess board component
│   │   ├── session/         # Session-related components
│   │   │   ├── SessionManager.tsx  # Manages training sessions
│   │   │   └── SessionStats.tsx    # Displays session statistics
│   │   └── navigation/      # Navigation components
│   ├── contexts/            # React contexts
│   │   ├── AppStateContext.tsx  # Global application state
│   │   └── ThemeContext.tsx     # Theme management
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx     # Main navigation setup
│   ├── screens/             # Application screens
│   │   └── MainScreen.tsx       # Main screen with chess board
│   ├── services/            # Business logic services
│   │   ├── PuzzleService.ts     # Manages puzzle data
│   │   ├── SessionService.ts    # Handles session data
│   │   └── TimerService.ts      # Manages timer functionality
│   ├── styles/              # Styling utilities
│   │   └── theme.ts             # Theme definitions
│   ├── utils/               # Utility functions
│   │   ├── assetLoader.ts       # Asset loading utilities
│   │   ├── puzzleParser.ts      # Parses puzzle data
│   │   ├── PuzzlePlayer.ts      # Handles puzzle gameplay
│   │   ├── sounds.ts            # Sound management
│   │   └── timeUtils.ts         # Time formatting utilities
│   └── __tests__/           # Unit tests
│       └── TimerService.test.ts # Tests for TimerService
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── index.ts                 # Entry point
├── jest.config.js           # Jest configuration
├── metro.config.js          # Metro bundler configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Key Features

### 1. Chess Board and Puzzle Solving

The application provides an interactive chess board where users can solve puzzles. The `ChessBoard` component uses `react-native-chessboard` for rendering and interaction, while `chess.js` handles the game logic.

```typescript
// ChessBoard.tsx (simplified)
export const ChessBoard: React.FC<ChessBoardProps> = ({ isDark = false }) => {
  // ...
  const handleMove = ({ state }: any) => {
    // Play appropriate sound based on move
    if (state.in_check) {
      playSound('check');
    } else if (state.in_checkmate) {
      playSound('success');
    } else if (state.history.length > 0) {
      const lastMove = state.history[state.history.length - 1];
      if (lastMove.captured) {
        playSound('capture');
      } else {
        playSound('move');
      }
    }
  };
  // ...
}
```

### 2. Theme Management

The application supports both light and dark themes through the `ThemeContext`. This context provides theme values and a function to toggle between themes.

```typescript
// ThemeContext.tsx (simplified)
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(deviceColorScheme || 'light');
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  
  // ...
  
  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 3. Session Management

The application tracks training sessions using the `AppStateContext` and `TimerService`. This allows users to start, pause, and end sessions, with statistics tracked throughout.

```typescript
// SessionManager.tsx (simplified)
export const SessionManager: React.FC = () => {
  const { state, dispatch } = useAppState();
  
  // Set up the dispatch function for the timer service
  useEffect(() => {
    timerService.setDispatch(dispatch);
    return () => timerService.cleanup();
  }, [dispatch]);
  
  // Control the timer based on session state
  useEffect(() => {
    if (isActive) {
      timerService.start();
    } else {
      timerService.stop();
    }
  }, [isActive]);
  
  // ...
}
```

### 4. Sound Effects

The application uses `expo-av` to play sound effects for different chess moves and events, enhancing the user experience.

```typescript
// sounds.ts (simplified)
export const playSound = async (name: SoundName): Promise<void> => {
  try {
    const sound = loadedSounds[name];
    
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.stopAsync();
      await sound.playAsync();
    }
  } catch (error) {
    // Silently handle errors
  }
};
```

### 5. Puzzle Management

The `PuzzleService` and `PuzzlePlayer` classes handle puzzle data and gameplay. Puzzles can be loaded, played, and tracked for progress.

```typescript
// PuzzlePlayer.ts (simplified)
export class PuzzlePlayer {
  // ...
  
  loadPuzzle(puzzle: Puzzle): void {
    this.currentPuzzle = puzzle;
    this.currentSolutionIndex = 0;
    
    // Reset the chess board to the puzzle's FEN
    this.chess.load(puzzle.fen);
    
    // Make the first move (AI move)
    if (puzzle.moves.length > 0) {
      const firstMove = puzzle.moves[0];
      this.chess.move(firstMove);
      this.currentSolutionIndex = 1;
      this.isUserTurn = true;
      
      if (this.options.onAiMove) {
        this.options.onAiMove(firstMove);
      }
    }
  }
  
  // ...
}
```

## Development Workflow

### Running the App

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Testing

```bash
# Run tests
npm test
```

## Architecture Decisions

### 1. Context API for State Management

The application uses React Context API instead of Redux for state management. This decision was made to reduce bundle size and complexity while still providing global state management capabilities.

### 2. Service-Based Architecture

Business logic is encapsulated in service classes (e.g., `TimerService`, `PuzzleService`) to separate concerns and make the code more maintainable and testable.

### 3. Functional Components with Hooks

The application uses functional components with React hooks throughout, following modern React best practices.

### 4. TypeScript for Type Safety

TypeScript is used to provide static type checking, improving code quality and developer experience.

### 5. Expo for Cross-Platform Development

Expo was chosen to simplify development and deployment across multiple platforms (iOS, Android, web).

## Contributing

To contribute to this project:

1. Familiarize yourself with the project structure and architecture
2. Follow the TypeScript and React Native best practices
3. Write tests for new features
4. Ensure your code passes linting and type checking
5. Submit a pull request with a clear description of your changes