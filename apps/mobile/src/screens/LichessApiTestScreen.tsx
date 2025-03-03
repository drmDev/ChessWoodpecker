import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Interface for puzzle item
interface PuzzleItem {
  id: string;
  category: string;
  isFetching: boolean;
  isDisabled: boolean;
}

export const LichessApiTestScreen: React.FC = () => {
  const { theme, themeMode } = useTheme();
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load the first 10 puzzles from the default collection
  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    try {
      // Load the default collection JSON
      const defaultCollection = require('../../assets/puzzles/default-collection.json');
      
      // Extract the first 10 puzzles (2 from each of the first 5 categories)
      const firstTenPuzzles: PuzzleItem[] = [];
      
      let categoriesProcessed = 0;
      for (const category in defaultCollection) {
        if (categoriesProcessed >= 5) break;
        
        const puzzlesInCategory = defaultCollection[category];
        const puzzlesToTake = Math.min(2, puzzlesInCategory.length);
        
        for (let i = 0; i < puzzlesToTake; i++) {
          firstTenPuzzles.push({
            id: puzzlesInCategory[i],
            category,
            isFetching: false,
            isDisabled: false
          });
        }
        
        categoriesProcessed++;
      }
      
      setPuzzles(firstTenPuzzles);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      setIsLoading(false);
    }
  };

  const fetchPuzzle = async (id: string, index: number) => {
    // Update state to show loading and disable button
    setPuzzles(prev => prev.map((puzzle, i) => 
      i === index ? { ...puzzle, isFetching: true, isDisabled: true } : puzzle
    ));
    
    try {
      // Make API request to Lichess
      const response = await fetch(`https://lichess.org/api/puzzle/${id}`);
      const data = await response.json();
      
      // Log the response
      console.log(`Puzzle ${id} Response:`, data);
      
      // Update state after fetch completes
      setPuzzles(prev => prev.map((puzzle, i) => 
        i === index ? { ...puzzle, isFetching: false, isDisabled: true } : puzzle
      ));
    } catch (error) {
      console.error(`Error fetching puzzle ${id}:`, error);
      
      // Update state to show error
      setPuzzles(prev => prev.map((puzzle, i) => 
        i === index ? { ...puzzle, isFetching: false, isDisabled: false } : puzzle
      ));
    }
  };

  const renderPuzzleItem = ({ item, index }: { item: PuzzleItem; index: number }) => (
    <View style={[styles.puzzleItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.puzzleInfo}>
        <Text style={[styles.puzzleId, { color: theme.text }]}>{item.id}</Text>
        <Text style={[styles.puzzleCategory, { color: theme.textSecondary }]}>{item.category}</Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.getButton, 
          { backgroundColor: theme.primary },
          item.isDisabled && { backgroundColor: theme.border }
        ]}
        onPress={() => fetchPuzzle(item.id, index)}
        disabled={item.isDisabled || item.isFetching}
      >
        {item.isFetching ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.getButtonText}>GET</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Lichess API Test</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Click GET to fetch puzzle data from Lichess API
      </Text>
      
      <FlatList
        data={puzzles}
        renderItem={renderPuzzleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  puzzleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  puzzleInfo: {
    flex: 1,
  },
  puzzleId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  puzzleCategory: {
    fontSize: 14,
  },
  getButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 