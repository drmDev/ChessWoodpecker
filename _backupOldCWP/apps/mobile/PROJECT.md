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
- **Custom Chess Board**: In-house implementation of an interactive chessboard component with orientation support and gesture handling

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

TODO: redo tree when its back in a solid state

## Key Features

### 1. Chess Board and Puzzle Solving

The application provides an interactive chess board where users can solve puzzles. The custom `OrientableChessBoard` component handles rendering and interaction, while `chess.js` handles the game logic.

### 2. Puzzle Integration

The application integrates with our backend API to provide a variety of chess puzzles. The puzzles are cached locally for offline access and better performance.

### 3. Theme Management

The application supports both light and dark themes through the `ThemeContext`. This context provides theme values and a function to toggle between themes.

### 4. Session Management

TODO: redo and simplify

### 5. Sound Effects

The application uses `expo-av` to play sound effects for different chess moves and events, enhancing the user experience.

### 6. Navigation

The application uses React Navigation's bottom tab navigator to provide navigation between different screens.