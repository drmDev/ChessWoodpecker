import AsyncStorage from '@react-native-async-storage/async-storage';
import { Puzzle, PuzzleCategory, PuzzleCollection } from '../utils/puzzleParser';

// Storage keys
const PUZZLE_CACHE_KEY = '@ChessWoodpecker:puzzleCache';
const USER_COLLECTIONS_KEY = '@ChessWoodpecker:userCollections';

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
      await this.loadPuzzleCache();
      await this.loadUserCollections();
      
      // Load default collection if needed
      if (this.collections.length === 0) {
        this.defaultCollection = {
          categories: [
            {
              name: 'Sample',
              puzzles: [
                {
                  id: '12345',
                  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                  moves: ['e2e4', 'e7e5', 'g1f3'],
                  rating: 1500,
                  ratingDeviation: 75,
                  popularity: 80,
                  nbPlays: 100,
                  themes: ['opening'],
                  gameUrl: 'https://lichess.org/training/12345'
                }
              ]
            }
          ]
        };
        this.collections.push(this.defaultCollection);
      }
    } catch (error) {
      console.error('Failed to initialize PuzzleService:', error);
    }
  }

  /**
   * Load puzzle cache from storage
   */
  private async loadPuzzleCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem(PUZZLE_CACHE_KEY);
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
      const collectionsData = await AsyncStorage.getItem(USER_COLLECTIONS_KEY);
      if (collectionsData) {
        this.collections = JSON.parse(collectionsData);
      }
    } catch (error) {
      console.error('Failed to load user collections:', error);
    }
  }

  /**
   * Get puzzle data by ID
   */
  public async getPuzzleData(puzzleId: string): Promise<PuzzleData | null> {
    // Check cache first
    if (this.puzzleCache[puzzleId]) {
      return this.puzzleCache[puzzleId];
    }
    
    try {
      // In a real app, this would fetch from Lichess API
      // For now, return a placeholder
      return null;
    } catch (error) {
      console.error(`Failed to get puzzle data for ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Get all collections
   */
  public getCollections(): PuzzleCollection[] {
    return this.collections;
  }

  /**
   * Get a specific collection by name
   */
  public getCollection(name: string): PuzzleCollection | null {
    return this.collections.find(
      collection => collection.categories.some(category => category.name === name)
    ) || null;
  }

  /**
   * Get puzzles from a specific category
   */
  public getPuzzlesFromCategory(categoryName: string): Puzzle[] {
    for (const collection of this.collections) {
      const category = collection.categories.find(c => c.name === categoryName);
      if (category) {
        return category.puzzles;
      }
    }
    return [];
  }

  /**
   * Get all categories from all collections
   */
  public getAllCategories(): PuzzleCategory[] {
    const categories: PuzzleCategory[] = [];
    for (const collection of this.collections) {
      categories.push(...collection.categories);
    }
    return categories;
  }
}

// Create a singleton instance
export const puzzleService = PuzzleService.getInstance(); 