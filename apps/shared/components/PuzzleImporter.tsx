import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform } from 'react-native';
import { parseTextFormat } from '../utils/puzzleParser';
import { PuzzleService } from '../services/PuzzleService';

interface PuzzleImporterProps {
  onImportComplete?: () => void;
}

/**
 * Component for importing user puzzles
 */
export const PuzzleImporter: React.FC<PuzzleImporterProps> = ({ onImportComplete }) => {
  const [text, setText] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleImport = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!text.trim()) {
        setError('Please enter puzzle data');
        return;
      }
      
      if (!collectionName.trim()) {
        setError('Please enter a collection name');
        return;
      }
      
      // Parse the text format
      const collection = parseTextFormat(text, collectionName);
      
      // Validate the collection
      if (collection.categories.length === 0) {
        setError('No valid puzzles found. Please check the format.');
        return;
      }
      
      // Count total puzzles
      const totalPuzzles = collection.categories.reduce(
        (sum, category) => sum + category.puzzles.length, 
        0
      );
      
      if (totalPuzzles === 0) {
        setError('No valid puzzles found. Please check the format.');
        return;
      }
      
      // Save the collection
      const puzzleService = PuzzleService.getInstance();
      await puzzleService.saveCollection(collection);
      
      // Show success message
      setSuccess(`Successfully imported ${totalPuzzles} puzzles in ${collection.categories.length} categories.`);
      
      // Clear form
      setText('');
      setCollectionName('');
      
      // Notify parent
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing puzzles:', error);
      setError('Failed to import puzzles. Please check the format and try again.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Puzzles</Text>
      
      <Text style={styles.label}>Collection Name:</Text>
      <TextInput
        style={styles.input}
        value={collectionName}
        onChangeText={setCollectionName}
        placeholder="Enter collection name"
      />
      
      <Text style={styles.label}>Puzzle Data:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={text}
        onChangeText={setText}
        placeholder="Paste puzzle data here..."
        multiline
        numberOfLines={10}
        textAlignVertical="top"
      />
      
      <Text style={styles.formatHelp}>
        Format: Category name followed by puzzle URLs, one per line.
        {'\n\n'}
        Example:
        {'\n'}
        PINS
        {'\n'}
        https://lichess.org/training/zekfA
        {'\n'}
        https://lichess.org/training/elqPh
      </Text>
      
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      
      <Button title="Import Puzzles" onPress={handleImport} />
      
      {Platform.OS === 'web' && (
        <View style={styles.fileUploadContainer}>
          <Text style={styles.label}>Or upload a text file:</Text>
          <input
            type="file"
            accept=".txt"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) {
                    setText(event.target.result as string);
                  }
                };
                reader.readAsText(file);
                
                // Use filename as collection name if not set
                if (!collectionName) {
                  setCollectionName(file.name.replace(/\.txt$/, ''));
                }
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  formatHelp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  success: {
    color: 'green',
    marginBottom: 16,
  },
  fileUploadContainer: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    borderStyle: 'dashed',
  },
}); 