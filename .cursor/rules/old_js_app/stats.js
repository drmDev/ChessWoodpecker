export class SessionStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.stats = {
            totalPuzzles: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            totalTimeMs: 0,
            startTime: Date.now(),

            // Detailed tracking
            successfulPuzzles: [],
            failedPuzzles: [],

            // Category tracking
            categoryCounts: {}
        };
    }

    ensureCategoryStats(category) {
        if (!this.stats.categoryStats[category]) {
            this.stats.categoryStats[category] = {
                total: 0,
                correct: 0
            };
        }
    }

    recordPuzzleAttempt(puzzleMetadata, success) {
        this.stats.totalPuzzles++;

        // Track by success/failure
        if (success) {
            this.stats.totalSuccessful++;
            this.stats.successfulPuzzles.push({
                id: puzzleMetadata.id,
                category: puzzleMetadata.category,
                rating: puzzleMetadata.rating,
                timestamp: Date.now()
            });
        } else {
            this.stats.totalFailed++;
            this.stats.failedPuzzles.push({
                id: puzzleMetadata.id,
                category: puzzleMetadata.category,
                rating: puzzleMetadata.rating,
                timestamp: Date.now()
            });
        }

        // Track by category
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
    }

    getSuccessRate() {
        return (this.stats.correctPuzzles / this.stats.totalPuzzles * 100).toFixed(1);
    }

    getStats() {
        return this.stats;
    }

    setTotalTime(timeMs) {
        this.stats.totalTimeMs = timeMs;
    }

    getCompletedPuzzleIds() {
        const successIds = this.stats.successfulPuzzles.map(p => p.id);
        const failedIds = this.stats.failedPuzzles.map(p => p.id);
        // Use a Set to ensure unique values
        return [...new Set([...successIds, ...failedIds])];
    }

    // Get successful puzzle IDs
    getSuccessfulPuzzleIds() {
        return this.stats.successfulPuzzles.map(p => p.id);
    }

    // Get failed puzzle IDs
    getFailedPuzzleIds() {
        return this.stats.failedPuzzles.map(p => p.id);
    }

    // Get percentage of successful puzzles
    getSuccessPercentage() {
        if (this.stats.totalPuzzles === 0) return 0;
        return (this.stats.totalSuccessful / this.stats.totalPuzzles) * 100;
    }

    // Get percentage of failed puzzles
    getFailurePercentage() {
        if (this.stats.totalPuzzles === 0) return 0;
        return (this.stats.totalFailed / this.stats.totalPuzzles) * 100;
    }

    // Get category statistics
    getCategoryStats() {
        return this.stats.categoryCounts;
    }

    exportToCSV() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const successRate = (this.stats.correctPuzzles / this.stats.totalPuzzles * 100).toFixed(1);
        const hours = Math.floor(this.stats.totalTimeMs / 3600000);
        const minutes = Math.floor((this.stats.totalTimeMs % 3600000) / 60000);
        const seconds = ((this.stats.totalTimeMs % 60000) / 1000).toFixed(0);
        const totalTimeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.padStart(2, '0')}`;

        let csvContent = [];

        // Add headers
        csvContent.push(['Chess Woodpecker Session Summary', timestamp]);
        csvContent.push([]); // Empty row for spacing

        // Overall Stats
        csvContent.push(['OVERALL PERFORMANCE']);
        csvContent.push(['Total Puzzles', 'Completed', 'Success Rate', 'Total Time']);
        csvContent.push([
            this.stats.totalPuzzles,
            this.stats.correctPuzzles,
            `${successRate}%`,
            totalTimeFormatted
        ]);
        csvContent.push([]); // Empty row for spacing

        // Category Stats
        csvContent.push(['PERFORMANCE BY CATEGORY']);
        csvContent.push(['Category', 'Completed', 'Total', 'Success Rate']);
        for (const category in this.stats.categoryStats) {
            const stats = this.stats.categoryStats[category];
            const categoryRate = (stats.correct / stats.total * 100).toFixed(1);
            csvContent.push([
                category,
                stats.correct,
                stats.total,
                `${categoryRate}%`
            ]);
        }
        csvContent.push([]); // Empty row for spacing

        // Failed Puzzles
        csvContent.push(['FAILED PUZZLES']);
        csvContent.push(['Category', 'Lichess URL']);
        if (this.stats.failedPuzzles.length > 0) {
            this.stats.failedPuzzles.forEach(puzzle => {
                csvContent.push([
                    puzzle.category,
                    puzzle.url
                ]);
            });
        } else {
            csvContent.push(['No failed puzzles!', '']);
        }

        // Convert arrays to CSV format
        const csvString = csvContent
            .map(row => row
                .map(cell => {
                    // Handle cells that contain commas by wrapping in quotes
                    if (cell && cell.toString().includes(',')) {
                        return `"${cell}"`;
                    }
                    return cell;
                })
                .join(',')
            )
            .join('\n');

        // Create blob and download with CSV mime type
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chess-woodpecker-summary-${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}