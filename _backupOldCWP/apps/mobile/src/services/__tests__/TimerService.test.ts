import { TimerService } from '../TimerService';

// Mock the dispatch function
const mockDispatch = jest.fn();

describe('TimerService', () => {
  let timerService: TimerService;
  
  // Mock setInterval and clearInterval
  beforeEach(() => {
    jest.useFakeTimers();
    timerService = new TimerService();
    timerService.setDispatch(mockDispatch);
    mockDispatch.mockClear();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should initialize with default values', () => {
    expect(timerService.isRunning()).toBe(false);
  });
  
  test('should set dispatch function', () => {
    const newMockDispatch = jest.fn();
    timerService.setDispatch(newMockDispatch);
    
    timerService.start();
    jest.advanceTimersByTime(1000);
    
    expect(newMockDispatch).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
  
  test('should start the timer', () => {
    timerService.start();
    expect(timerService.isRunning()).toBe(true);
  });
  
  test('should stop the timer', () => {
    timerService.start();
    timerService.stop();
    expect(timerService.isRunning()).toBe(false);
  });
  
  test('should dispatch UPDATE_TIME_DELTA action when timer ticks', () => {
    timerService.start();
    jest.advanceTimersByTime(1000);
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_TIME_DELTA',
      payload: expect.any(Number)
    });
  });
  
  test('should not dispatch if no dispatch function is set', () => {
    timerService.setDispatch(null as any);
    timerService.start();
    jest.advanceTimersByTime(1000);
    
    expect(mockDispatch).not.toHaveBeenCalled();
  });
  
  test('should cleanup resources', () => {
    timerService.start();
    timerService.cleanup();
    
    expect(timerService.isRunning()).toBe(false);
    
    // After cleanup, dispatching should not happen
    jest.advanceTimersByTime(1000);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
  
  test('should set tick interval', () => {
    timerService.setTickInterval(2000);
    timerService.start();
    
    // After 1 second, no dispatch should happen
    jest.advanceTimersByTime(1000);
    expect(mockDispatch).not.toHaveBeenCalled();
    
    // After 2 seconds, dispatch should happen
    jest.advanceTimersByTime(1000);
    expect(mockDispatch).toHaveBeenCalled();
  });
  
  test('should restart timer when setting tick interval while running', () => {
    timerService.start();
    const stopSpy = jest.spyOn(timerService, 'stop');
    const startSpy = jest.spyOn(timerService, 'start');
    
    timerService.setTickInterval(2000);
    
    expect(stopSpy).toHaveBeenCalled();
    expect(startSpy).toHaveBeenCalled();
  });
}); 