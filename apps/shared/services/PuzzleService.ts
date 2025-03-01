import { Platform } from 'react-native';
// Use conditional import for AsyncStorage
let AsyncStorage: any;
if (Platform.OS !== 'web') {
  // Only import AsyncStorage for non-web platforms
  // This will be properly resolved at runtime
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}
import { Puzzle, PuzzleCategory, PuzzleCollection } from '../utils/puzzleParser';

// Default collection path
const DEFAULT_COLLECTION_PATH = '../assets/puzzles/default-collection.json';

// Interface for puzzle data from Lichess API
export interface PuzzleData {
  id: string;
  pgn: string;
  initialPly: number;
  solution: string[];
  themes?: string[];
  rating?: number;
}

/**
 * Service for managing puzzle collections and data
 */
export class PuzzleService {
  private static instance: PuzzleService;
  private puzzleCache: Record<string, PuzzleData> = {};
  private collections: PuzzleCollection[] = [];
  private defaultCollection: PuzzleCollection | null = null;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PuzzleService {
    if (!PuzzleService.instance) {
      PuzzleService.instance = new PuzzleService();
    }
    return PuzzleService.instance;
  }
  
  /**
   * Initialize the service by loading default collection and cache
   */
  public async initialize(): Promise<void> {
    try {
      // Load default collection
      this.defaultCollection = await this.loadDefaultCollection();
      
      // Load puzzle cache from storage
      await this.loadPuzzleCache();
      
      // Load user collections
      await this.loadUserCollections();
    } catch (error) {
      console.error('Failed to initialize PuzzleService:', error);
    }
  }
  
  /**
   * Load the default puzzle collection
   */
  private async loadDefaultCollection(): Promise<PuzzleCollection> {
    try {
      // In a real app, we would use require() or import() for bundled assets
      // For this example, we'll simulate loading from a file
      const defaultCollection = require(DEFAULT_COLLECTION_PATH);
      return defaultCollection;
    } catch (error) {
      console.error('Failed to load default collection:', error);
      // Return an empty collection as fallback
      return { version: "1.0", categories: [] };
    }
  }
  
  /**
   * Load the puzzle cache from storage
   */
  private async loadPuzzleCache(): Promise<void> {
    try {
      const cacheData = await this.getFromStorage('puzzle_cache');
      if (cacheData) {
        this.puzzleCache = JSON.parse(cacheData);
      }
    } catch (error) {
      console.error('Failed to load puzzle cache:', error);
    }
  }
  
  /**
   * Load user collections from storage
   */
  private async loadUserCollections(): Promise<void> {
    try {
      const collectionsData = await this.getFromStorage('user_collections');
      if (collectionsData) {
        this.collections = JSON.parse(collectionsData);
      }
    } catch (error) {
      console.error('Failed to load user collections:', error);
    }
  }
  
  /**
   * Get puzzle data from cache or fetch from API
   */
  public async getPuzzleData(puzzleId: string): Promise<PuzzleData> {
    // Check if puzzle exists in cache
    if (this.puzzleCache[puzzleId]) {
      return this.puzzleCache[puzzleId];
    }
    
    // If not in cache, fetch from Lichess API
    const puzzleData = await this.fetchPuzzleFromLichess(puzzleId);
    
    // Store in cache
    this.puzzleCache[puzzleId] = puzzleData;
    await this.savePuzzleCache();
    
    return puzzleData;
  }
  
  /**
   * Fetch puzzle data from Lichess API
   */
  private async fetchPuzzleFromLichess(puzzleId: string): Promise<PuzzleData> {
    try {
      const response = await fetch(`https://lichess.org/api/puzzle/${puzzleId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract only the data we need
      return {
        id: data.puzzle.id,
        pgn: data.game.pgn,
        initialPly: data.puzzle.initialPly,
        solution: data.puzzle.solution,
        themes: data.puzzle.themes,
        rating: data.puzzle.rating
      };
    } catch (error) {
      console.error(`Error fetching puzzle ${puzzleId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save the puzzle cache to storage
   */
  private async savePuzzleCache(): Promise<void> {
    try {
      await this.saveToStorage('puzzle_cache', JSON.stringify(this.puzzleCache));
    } catch (error) {
      console.error('Failed to save puzzle cache:', error);
    }
  }
  
  /**
   * Get all available collections
   */
  public getCollections(): PuzzleCollection[] {
    const allCollections: PuzzleCollection[] = [];
    
    if (this.defaultCollection) {
      allCollections.push({
        ...this.defaultCollection,
        name: 'Default Collection'
      });
    }
    
    return [...allCollections, ...this.collections];
  }
  
  /**
   * Get a collection by name
   */
  public getCollection(name: string): PuzzleCollection | null {
    if (name === 'Default Collection' && this.defaultCollection) {
      return {
        ...this.defaultCollection,
        name: 'Default Collection'
      };
    }
    
    return this.collections.find(c => c.name === name) || null;
  }
  
  /**
   * Add or update a user collection
   */
  public async saveCollection(collection: PuzzleCollection): Promise<void> {
    // Find if collection already exists
    const index = this.collections.findIndex(c => c.name === collection.name);
    
    if (index >= 0) {
      // Update existing collection
      this.collections[index] = collection;
    } else {
      // Add new collection
      this.collections.push(collection);
    }
    
    // Save to storage
    await this.saveUserCollections();
  }
  
  /**
   * Delete a user collection
   */
  public async deleteCollection(name: string): Promise<void> {
    this.collections = this.collections.filter(c => c.name !== name);
    await this.saveUserCollections();
  }
  
  /**
   * Save user collections to storage
   */
  private async saveUserCollections(): Promise<void> {
    try {
      await this.saveToStorage('user_collections', JSON.stringify(this.collections));
    } catch (error) {
      console.error('Failed to save user collections:', error);
    }
  }
  
  /**
   * Helper method to get data from storage (works on both web and mobile)
   */
  private async getFromStorage(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return AsyncStorage.getItem(key);
    }
  }
  
  /**
   * Helper method to save data to storage (works on both web and mobile)
   */
  private async saveToStorage(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }
  
  /**
   * Get all puzzles from a category
   */
  public getPuzzlesFromCategory(categoryName: string, collectionName?: string): Puzzle[] {
    let collection: PuzzleCollection | null = null;
    
    if (collectionName) {
      collection = this.getCollection(collectionName);
    } else if (this.defaultCollection) {
      collection = this.defaultCollection;
    }
    
    if (!collection) return [];
    
    const category = collection.categories.find(c => c.name === categoryName);
    return category?.puzzles || [];
  }
  
  /**
   * Get all categories from a collection
   */
  public getCategoriesFromCollection(collectionName?: string): PuzzleCategory[] {
    let collection: PuzzleCollection | null = null;
    
    if (collectionName) {
      collection = this.getCollection(collectionName);
    } else if (this.defaultCollection) {
      collection = this.defaultCollection;
    }
    
    return collection?.categories || [];
  }
} 