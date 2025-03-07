import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PuzzleAttempt {
    id: string;
    category: string;
    rating: number;
    timestamp: number;
}

export interface CategoryStats {
    total: number;
    successful: number;
    failed: number;
}

export interface SessionData {
    totalPuzzles: number;
    totalSuccessful: number;
    totalFailed: number;
    totalTimeMs: number;
    startTime: number;
    successfulPuzzles: PuzzleAttempt[];
    failedPuzzles: PuzzleAttempt[];
    categoryCounts: Record<string, CategoryStats>;
    // Mobile specific additions
    lastPausedAt?: number;
    currentPuzzleId?: string;
    isSessionPaused: boolean;
}

const STORAGE_KEY = '@chess_woodpecker_session';

export class SessionStats {
    private stats: SessionData = {
        totalPuzzles: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalTimeMs: 0,
        startTime: Date.now(),
        successfulPuzzles: [],
        failedPuzzles: [],
        categoryCounts: {},
        isSessionPaused: false
    };

    constructor() {
        this.reset();
    }

    reset(): void {
        this.stats = {
            totalPuzzles: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            totalTimeMs: 0,
            startTime: Date.now(),
            successfulPuzzles: [],
            failedPuzzles: [],
            categoryCounts: {},
            isSessionPaused: false
        };
    }

    recordPuzzleAttempt(puzzleMetadata: { id: string; category: string; rating: number }, success: boolean): void {
        this.stats.totalPuzzles++;

        const attempt: PuzzleAttempt = {
            id: puzzleMetadata.id,
            category: puzzleMetadata.category,
            rating: puzzleMetadata.rating,
            timestamp: Date.now()
        };

        if (success) {
            this.stats.totalSuccessful++;
            this.stats.successfulPuzzles.push(attempt);
        } else {
            this.stats.totalFailed++;
            this.stats.failedPuzzles.push(attempt);
        }

        const category = puzzleMetadata.category || 'Uncategorized';
        if (!this.stats.categoryCounts[category]) {
            this.stats.categoryCounts[category] = {
                total: 0,
                successful: 0,
                failed: 0
            };
        }

        this.stats.categoryCounts[category].total++;
        if (success) {
            this.stats.categoryCounts[category].successful++;
        } else {
            this.stats.categoryCounts[category].failed++;
        }

        // Auto-save after each attempt
        this.saveSession();
    }

    async pauseSession(currentPuzzleId: string): Promise<void> {
        this.stats.isSessionPaused = true;
        this.stats.lastPausedAt = Date.now();
        this.stats.currentPuzzleId = currentPuzzleId;
        await this.saveSession();
    }

    async resumeSession(): Promise<void> {
        if (this.stats.lastPausedAt) {
            const pauseDuration = Date.now() - this.stats.lastPausedAt;
            this.stats.startTime += pauseDuration; // Adjust start time to account for pause
        }
        this.stats.isSessionPaused = false;
        this.stats.lastPausedAt = undefined;
        await this.saveSession();
    }

    getSuccessRate(): number {
        if (this.stats.totalPuzzles === 0) return 0;
        return (this.stats.totalSuccessful / this.stats.totalPuzzles) * 100;
    }

    getStats(): SessionData {
        return this.stats;
    }

    setTotalTime(timeMs: number): void {
        this.stats.totalTimeMs = timeMs;
    }

    getCompletedPuzzleIds(): string[] {
        const successIds = this.stats.successfulPuzzles.map(p => p.id);
        const failedIds = this.stats.failedPuzzles.map(p => p.id);
        return [...new Set([...successIds, ...failedIds])];
    }

    getSuccessfulPuzzleIds(): string[] {
        return this.stats.successfulPuzzles.map(p => p.id);
    }

    getFailedPuzzleIds(): string[] {
        return this.stats.failedPuzzles.map(p => p.id);
    }

    getCategoryStats(): Record<string, CategoryStats> {
        return this.stats.categoryCounts;
    }

    async saveSession(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    async loadSession(): Promise<boolean> {
        try {
            const savedSession = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedSession) {
                this.stats = JSON.parse(savedSession);
                return true;
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        return false;
    }

    async clearSavedSession(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            this.reset();
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    // Helper method to get current puzzle if session was paused
    getCurrentPuzzleId(): string | undefined {
        return this.stats.currentPuzzleId;
    }

    isCurrentSessionPaused(): boolean {
        return this.stats.isSessionPaused;
    }

    getSessionDuration(): number {
        if (this.stats.isSessionPaused && this.stats.lastPausedAt) {
            return this.stats.lastPausedAt - this.stats.startTime;
        }
        return Date.now() - this.stats.startTime;
    }
} 