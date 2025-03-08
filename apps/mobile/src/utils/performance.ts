/**
 * Utility functions for performance monitoring and logging
 */

// Maximum number of entries to keep in the performance log
const MAX_LOG_ENTRIES = 100;

// Performance metrics interface
export interface PerformanceMetric {
  type: 'animation' | 'render' | 'load';
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

// In-memory storage for performance metrics
const performanceLog: PerformanceMetric[] = [];

/**
 * Log a performance metric
 * @param metric The performance metric to log
 */
export function logPerformanceMetric(metric: PerformanceMetric): void {
  // Only log in development mode
  if (!__DEV__) return;
  
  // Add to the log
  performanceLog.unshift(metric);
  
  // Trim the log if it exceeds the maximum size
  if (performanceLog.length > MAX_LOG_ENTRIES) {
    performanceLog.pop();
  }
  
  // No console logging in production
}

/**
 * Log an animation performance metric
 * @param name Name of the animation
 * @param duration Duration in milliseconds
 * @param metadata Additional metadata
 */
export function logAnimationPerformance(name: string, duration: number, metadata?: Record<string, any>): void {
  const now = Date.now();
  logPerformanceMetric({
    type: 'animation',
    name,
    startTime: now - duration,
    endTime: now,
    duration,
    metadata
  });
}

/**
 * Start timing a performance metric
 * @param type Type of performance metric
 * @param name Name of the operation
 * @param metadata Additional metadata
 * @returns A function to call when the operation is complete
 */
export function startTiming(type: 'animation' | 'render' | 'load', name: string, metadata?: Record<string, any>): () => void {
  // Only time in development mode
  if (!__DEV__) return () => {};
  
  const startTime = Date.now();
  
  return () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logPerformanceMetric({
      type,
      name,
      startTime,
      endTime,
      duration,
      metadata
    });
  };
}

/**
 * Get the current performance log
 * @returns Array of performance metrics
 */
export function getPerformanceLog(): PerformanceMetric[] {
  return [...performanceLog];
}

/**
 * Clear the performance log
 */
export function clearPerformanceLog(): void {
  performanceLog.length = 0;
}

/**
 * Get performance statistics for a specific type of metric
 * @param type Type of performance metric
 * @returns Statistics about the performance metrics
 */
export function getPerformanceStats(type?: 'animation' | 'render' | 'load'): {
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
} {
  const metrics = type ? performanceLog.filter(m => m.type === type) : performanceLog;
  
  if (metrics.length === 0) {
    return {
      count: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      totalDuration: 0
    };
  }
  
  const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0);
  const minDuration = Math.min(...metrics.map(m => m.duration));
  const maxDuration = Math.max(...metrics.map(m => m.duration));
  
  return {
    count: metrics.length,
    averageDuration: totalDuration / metrics.length,
    minDuration,
    maxDuration,
    totalDuration
  };
} 