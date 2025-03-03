import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LichessPuzzleResponse, processPuzzleData, Puzzle } from '../models/PuzzleModel';
import { OrientableChessBoard } from '../components/chess/OrientableChessBoard';
import { 
  BoardOrientation, 
  getOrientationForPuzzle, 
  shouldFlipBoard, 
  calculateBoardTransform, 
  mapTouchCoordinates 
} from '../utils/boardOrientation';

// Interface for puzzle collection
interface PuzzleCollection {
  [category: string]: string[];
}

export const LichessApiTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [puzzleCollection, setPuzzleCollection] = useState<PuzzleCollection>({});
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<LichessPuzzleResponse | null>(null);
  
  // Board orientation state
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [autoOrientation, setAutoOrientation] = useState(true);
  
  // Update orientation when puzzle changes (if auto-orientation is enabled)
  useEffect(() => {
    if (currentPuzzle && autoOrientation) {
      const newOrientation = getOrientationForPuzzle(currentPuzzle.isWhiteToMove);
      setOrientation(newOrientation);
      // Log orientation information
      console.log('[Orientation] Puzzle loaded, auto-orientation:', newOrientation);
      console.log('[Orientation] Is White to Move:', currentPuzzle.isWhiteToMove);
    }
  }, [currentPuzzle, autoOrientation]);

  // Load the puzzle collection
  useEffect(() => {
    loadPuzzleCollection();
  }, []);

  const loadPuzzleCollection = async () => {
    try {
      // Load the default collection JSON
      const defaultCollection = require('../../assets/puzzles/default-collection.json');
      setPuzzleCollection(defaultCollection);
    } catch (error) {
      console.error('Error loading puzzle collection:', error);
    }
  };

  const fetchRandomPuzzle = async () => {
    setIsLoading(true);
    setCurrentPuzzle(null);
    setProcessingError(null);
    setApiResponse(null);
    
    try {
      // Get all puzzle IDs from the collection
      const allPuzzleIds: string[] = [];
      Object.values(puzzleCollection).forEach(ids => {
        allPuzzleIds.push(...ids);
      });
      
      // Select a random puzzle ID
      const randomIndex = Math.floor(Math.random() * allPuzzleIds.length);
      const randomId = allPuzzleIds[randomIndex];
      
      // Fetch the puzzle
      await fetchPuzzle(randomId);
    } catch (error) {
      console.error('Error fetching random puzzle:', error);
      setProcessingError(`Error fetching random puzzle: ${error}`);
      setIsLoading(false);
    }
  };

  const fetchPuzzle = async (id: string) => {
    setIsLoading(true);
    setCurrentPuzzleId(id);
    setProcessingError(null);
    
    try {
      // Make API request to Lichess
      const response = await fetch(`https://lichess.org/api/puzzle/${id}`);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store the API response
      setApiResponse(data);
      
      // Process the puzzle data
      try {
        const processedPuzzle = processPuzzleData(data);
        setCurrentPuzzle(processedPuzzle);
      } catch (processingError: any) {
        console.error('Error processing puzzle data:', processingError);
        setProcessingError(`Error processing puzzle data: ${processingError?.message || processingError}`);
      }
    } catch (error: any) {
      console.error(`Error fetching puzzle ${id}:`, error);
      setProcessingError(`Error fetching puzzle ${id}: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openLichessPuzzle = () => {
    if (currentPuzzleId) {
      const url = `https://lichess.org/training/${currentPuzzleId}`;
      Linking.openURL(url);
    }
  };
  
  // Function to manually flip the board orientation
  const toggleBoardOrientation = () => {
    const newOrientation = orientation === 'white' ? 'black' : 'white';
    setOrientation(newOrientation);
    
    // Log orientation change
    const isFlipped = shouldFlipBoard(newOrientation);
    const boardTransform = calculateBoardTransform(isFlipped);
    const screenWidth = Dimensions.get('window').width;
    const boardSize = Math.min(screenWidth - 32, 380);
    const moveExample = mapTouchCoordinates(0, 0, boardSize, isFlipped);
    
    console.log('[Orientation] Changed to:', newOrientation);
    console.log('[Orientation] Board flipped:', isFlipped);
    console.log('[Orientation] Board transform:', boardTransform);
    console.log('[Orientation] Move mapping example:', moveExample);
  };
  
  // Toggle auto-orientation setting
  const toggleAutoOrientation = () => {
    const newAutoOrientation = !autoOrientation;
    setAutoOrientation(newAutoOrientation);
    console.log('[Orientation] Auto-orientation:', newAutoOrientation);
    
    // If turning auto-orientation on, update orientation based on current puzzle
    if (newAutoOrientation && currentPuzzle) {
      const newOrientation = getOrientationForPuzzle(currentPuzzle.isWhiteToMove);
      setOrientation(newOrientation);
      console.log('[Orientation] Auto-adjusted to:', newOrientation);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Lichess Puzzle Test</Text>
        
        {/* Puzzle Selection */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={fetchRandomPuzzle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Fetch Random Puzzle</Text>
            )}
          </TouchableOpacity>
          
          {currentPuzzleId && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Puzzle ID:</Text>
              <Text style={[styles.value, { color: theme.text }]}>{currentPuzzleId}</Text>
            </View>
          )}
        </View>
        
        {/* Processing Error */}
        {processingError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error }]}>
            <Text style={styles.errorText}>{processingError}</Text>
          </View>
        )}
        
        {/* Chessboard Display - Only show when a puzzle is loaded */}
        {currentPuzzle && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Board View</Text>
            
            {/* Current Orientation Display */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Orientation:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {orientation} (flipped: {shouldFlipBoard(orientation).toString()})
              </Text>
            </View>
            
            {/* Turn Display */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Turn:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {currentPuzzle.isWhiteToMove ? 'White to move' : 'Black to move'}
              </Text>
            </View>
            
            {/* Chessboard */}
            <View style={styles.boardContainer}>
              <OrientableChessBoard 
                fen={currentPuzzle.fen} 
                orientation={orientation}
                disabled={true} // Disable moves for this test UI
              />
            </View>
            
            {/* Board Control Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.smallButton, { backgroundColor: theme.primary }]}
                onPress={toggleBoardOrientation}
              >
                <Text style={styles.buttonText}>Flip Board</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.smallButton, 
                  { backgroundColor: autoOrientation ? theme.success : theme.primary }
                ]}
                onPress={toggleAutoOrientation}
              >
                <Text style={styles.buttonText}>
                  Auto-Orient: {autoOrientation ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Puzzle Information */}
        {currentPuzzle && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Puzzle Information</Text>
            
            {/* PGN */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>PGN:</Text>
              <Text style={[styles.value, { color: theme.text }]} numberOfLines={3} ellipsizeMode="tail">
                {currentPuzzle.pgn}
              </Text>
            </View>
            
            {/* FEN */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>FEN:</Text>
              <Text style={[styles.value, { color: theme.text }]} numberOfLines={2} ellipsizeMode="tail">
                {currentPuzzle.fen}
              </Text>
            </View>
            
            {/* Themes */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Themes:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {currentPuzzle.themes && currentPuzzle.themes.length > 0 
                  ? currentPuzzle.themes.join(', ') 
                  : 'No themes'}
              </Text>
            </View>
            
            {/* Solution UCI */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Solution (UCI):</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {currentPuzzle.solutionMovesUCI && currentPuzzle.solutionMovesUCI.length > 0 
                  ? currentPuzzle.solutionMovesUCI.join(', ') 
                  : 'No solution moves'}
              </Text>
            </View>
            
            {/* Solution SAN */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Solution (SAN):</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {currentPuzzle.solutionMovesSAN && currentPuzzle.solutionMovesSAN.length > 0 
                  ? currentPuzzle.solutionMovesSAN.join(', ') 
                  : 'No solution moves converted'}
              </Text>
            </View>
            
            {/* Number of Moves */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Number of Moves:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {currentPuzzle.solutionMovesSAN ? currentPuzzle.solutionMovesSAN.length : 0}
              </Text>
            </View>
            
            {/* Lichess Link */}
            <TouchableOpacity 
              style={[styles.linkButton, { borderColor: theme.primary }]}
              onPress={openLichessPuzzle}
            >
              <Text style={[styles.linkButtonText, { color: theme.primary }]}>
                Open on Lichess
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    marginRight: 8,
  },
  value: {
    flex: 1,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFF',
  },
  linkButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  linkButtonText: {
    fontWeight: 'bold',
  },
  boardContainer: {
    width: '100%',
    aspectRatio: 1,
    marginVertical: 16,
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
}); 