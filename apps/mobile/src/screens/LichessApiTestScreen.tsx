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
  Platform
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LichessPuzzleResponse, processPuzzleData, Puzzle } from '../models/PuzzleModel';
import OrientableChessBoard from '../components/chess/mobile/OrientableChessBoard';
import { BoardOrientation } from '@utils/chess/orientation-utils';

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
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [isInteractingWithBoard, setIsInteractingWithBoard] = useState(false);

  // Set initial orientation when puzzle changes
  useEffect(() => {
    if (currentPuzzle) {
      setOrientation(currentPuzzle.isWhiteToMove ? 'white' : 'black');
    }
  }, [currentPuzzle]);

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
      setProcessingError('Error loading puzzle collection');
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
      setProcessingError('Error fetching random puzzle');
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
        setProcessingError(`Error processing puzzle data: ${processingError?.message || processingError}`);
      }
    } catch (error: any) {
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
  
  const handleDragStart = () => {
    setIsInteractingWithBoard(true);
  };

  const handleDragEnd = () => {
    setIsInteractingWithBoard(false);
  };

  // Function to manually flip the board orientation
  const toggleBoardOrientation = () => {
    setOrientation(prev => prev === 'white' ? 'black' : 'white');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isInteractingWithBoard}
      >
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
                {orientation}
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
                initialFen={currentPuzzle.fen}
                orientation={orientation}
                showCoordinates={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
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
            </View>
          </View>
        )}
        
        {/* Puzzle Information */}
        {currentPuzzle && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Puzzle Information</Text>
                        
            {/* Solution UCI */}
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Solution (UCI):</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {currentPuzzle.solutionMovesUCI.join(', ')}
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
  boardContainer: {
    alignSelf: 'center',
    aspectRatio: 1,
    marginVertical: 16,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  errorContainer: {
    borderRadius: 4,
    marginBottom: 16,
    padding: 16,
  },
  errorText: {
    color: '#FFF',
  },
  infoRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 100,
  },
  linkButton: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  linkButtonText: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 8,
    marginBottom: 24,
    padding: 16,
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
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  value: {
    flex: 1,
    flexWrap: 'wrap',
  },
}); 