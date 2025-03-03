/**
 * TimerService - A service to manage timer functionality outside of React's rendering cycle
 * 
 * This service handles starting, stopping, and updating timers without relying on React's useEffect.
 * It dispatches actions to update the application state when the timer ticks.
 */
export class TimerService {
  private timer: NodeJS.Timeout | null = null;
  private lastTick: number | null = null;
  private dispatch: Function | null = null;
  private tickInterval: number = 1000; // Default to 1 second

  /**
   * Sets the dispatch function to be used for sending actions
   * @param dispatch The dispatch function from useReducer or Redux
   */
  setDispatch(dispatch: Function): void {
    this.dispatch = dispatch;
  }

  /**
   * Sets the tick interval for the timer
   * @param interval Interval in milliseconds
   */
  setTickInterval(interval: number): void {
    this.tickInterval = interval;
    // Restart the timer if it's already running to apply the new interval
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Starts the timer
   * If a timer is already running, it will be stopped first
   */
  start(): void {
    if (this.timer) this.stop();
    
    this.lastTick = Date.now();
    this.timer = setInterval(() => {
      if (!this.dispatch) return;
      
      const now = Date.now();
      const elapsed = now - (this.lastTick || now);
      this.lastTick = now;
      
      this.dispatch({ 
        type: 'UPDATE_SESSION_TIME_DELTA', 
        payload: elapsed 
      });
    }, this.tickInterval);
  }

  /**
   * Stops the timer without resetting state
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Cleans up resources used by the timer
   * Should be called when the component using this service unmounts
   */
  cleanup(): void {
    this.stop();
    this.dispatch = null;
    this.lastTick = null;
  }

  /**
   * Checks if the timer is currently running
   * @returns True if the timer is running, false otherwise
   */
  isRunning(): boolean {
    return this.timer !== null;
  }
}

// Create a singleton instance
export const timerService = new TimerService(); 