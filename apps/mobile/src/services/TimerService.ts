/**
 * TimerService - A service to manage timer functionality outside of React's rendering cycle
 * 
 * This service handles starting, stopping, and updating timers without relying on React's useEffect.
 * It dispatches actions to update the application state when the timer ticks.
 */
import { AppState, AppStateStatus } from 'react-native';

export class TimerService {
  private timer: NodeJS.Timeout | null = null;
  private lastTick: number | null = null;
  private dispatch: Function | null = null;
  private tickInterval: number = 1000; // Default to 1 second
  private isPaused: boolean = false;
  private appStateSubscription: any = null;

  constructor() {
    // Set up app state change listener when service is created
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground - resume timer
      if (this.timer && this.isPaused) {
        this.resume();
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background - pause timer
      if (this.timer && !this.isPaused) {
        this.pause();
      }
    }
  }

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
    
    this.isPaused = false;
    this.lastTick = Date.now();
    this.timer = setInterval(() => {
      if (!this.dispatch || this.isPaused) return;
      
      const now = Date.now();
      const elapsed = now - (this.lastTick || now);
      this.lastTick = now;
      
      this.dispatch({ 
        type: 'UPDATE_TIME_DELTA', 
        payload: elapsed 
      });
    }, this.tickInterval);
  }

  /**
   * Stops the timer
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.lastTick = null;
    this.isPaused = false;
  }

  /**
   * Pauses the timer without stopping it completely
   * The timer will continue to run but won't dispatch updates
   */
  pause(): void {
    this.isPaused = true;
    this.lastTick = null; // Reset last tick to avoid large time jumps on resume
  }

  /**
   * Resumes a paused timer
   */
  resume(): void {
    if (!this.timer) {
      // If there's no timer running, start one
      this.start();
      return;
    }
    
    this.isPaused = false;
    this.lastTick = Date.now(); // Reset last tick to current time
  }

  /**
   * Cleans up resources when the service is no longer needed
   */
  cleanup(): void {
    this.stop();
    this.dispatch = null;

    // Remove app state listener when cleaning up
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
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