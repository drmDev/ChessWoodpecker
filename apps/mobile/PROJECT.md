# Chess Woodpecker - Mobile App

Chess Woodpecker is a mobile application designed for chess training using the "Woodpecker Method," which involves solving the same chess puzzles repeatedly to improve pattern recognition and calculation skills.

## Project Overview

This React Native application built with Expo provides a mobile interface for chess puzzle training. It features a chess board, puzzle solving functionality from the Lichess API, session tracking, and performance statistics.

## Technology Stack

### Core Technologies

- **TypeScript**: Strongly-typed programming language that builds on JavaScript
- **React Native**: Framework for building native mobile applications using React
- **Expo**: Platform for making universal React applications that run on Android and iOS

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
- **react-native-chessboard**: Provides the interactive chessboard component for mobile

### Navigation

- **React Navigation**: Handles screen navigation with bottom tabs
- **React Native Screens**: Improves navigation performance

### Storage and Data Management

- **AsyncStorage**: Persistent, key-value storage system for React Native
- **Expo Asset**: Manages assets like images and sounds

### External APIs

- **Lichess Puzzle API**: Provides chess puzzles with various themes and difficulty levels

### Audio

- **Expo AV**: Provides audio playback functionality for move sounds and notifications

### Testing

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Testing utilities for React Native

## Project Structure

```
apps/mobile/
├── assets/                  # Static assets (images, sounds)
│   ├── sounds/              # Sound effects for chess moves
│   └── puzzles/             # Puzzle collections in JSON format
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── chess/           # Chess-related components
│   │   │   └── mobile/      # Mobile-specific chess components
│   │   │       └── ChessBoard.tsx  # Mobile chess board implementation
│   │   │   └── ChessBoard.tsx  # Main chess board component
│   │   └── session/         # Session-related components
│   │       ├── SessionManager.tsx  # Manages training sessions
│   │       └── SessionStats.tsx    # Displays session statistics
│   ├── contexts/            # React contexts
│   │   ├── AppStateContext.tsx  # Global application state
│   │   └── ThemeContext.tsx     # Theme management
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx     # Main navigation setup with bottom tabs
│   ├── screens/             # Application screens
│   │   ├── MainScreen.tsx       # Main application screen
│   │   └── LichessApiTestScreen.tsx  # Screen for testing Lichess API
│   ├── services/            # Business logic services
│   │   ├── PuzzleService.ts     # Manages puzzle data and Lichess API
│   │   └── SessionService.ts    # Handles session data
│   ├── utils/               # Utility functions
│   │   ├── assetLoader.ts       # Asset loading utilities
│   │   └── sounds.ts            # Sound management
│   └── __tests__/           # Unit tests
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── app.config.js            # Additional Expo configuration
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

### 2. Puzzle Integration

The application integrates with our backend API to provide a variety of chess puzzles. The puzzles are cached locally for offline access and better performance.

```typescript
// PuzzleService.ts (simplified)
async fetchRandomPuzzle(): Promise<Puzzle> {
  try {
    // Check cache first
    const cachedPuzzle = await PuzzleCacheService.getPuzzle(id);
    if (cachedPuzzle) {
      return cachedPuzzle;
    }
    
    // If not in cache, fetch from backend
    const response = await fetch(`${this.baseUrl}/puzzles/${id}`);
    const data = await response.json();
    
    // Process and cache the puzzle
    const processedPuzzle = processPuzzleData(data);
    await PuzzleCacheService.storePuzzle(processedPuzzle);
    
    return processedPuzzle;
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    throw error;
  }
}
```

### 3. Theme Management

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

### 4. Session Management

The application tracks training sessions using the `AppStateContext`. This allows users to start, pause, and end sessions, with statistics tracked throughout.

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

### 5. Sound Effects

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

### 6. Navigation

The application uses React Navigation's bottom tab navigator to provide navigation between different screens.

```typescript
// AppNavigator.tsx (simplified)
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator>
        <Tab.Screen 
          name="Home" 
          component={MainScreen} 
          options={{ 
            title: 'Chess Woodpecker',
            headerShown: false,
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
```