import { formatTimeHHMMSS, formatTimeHuman } from '../timeUtils';

describe('timeUtils', () => {
  describe('formatTimeHHMMSS', () => {
    it('should format zero milliseconds correctly', () => {
      expect(formatTimeHHMMSS(0)).toBe('00:00:00');
    });

    it('should format seconds correctly', () => {
      expect(formatTimeHHMMSS(5000)).toBe('00:00:05');
      expect(formatTimeHHMMSS(45000)).toBe('00:00:45');
    });

    it('should format minutes correctly', () => {
      expect(formatTimeHHMMSS(60000)).toBe('00:01:00');
      expect(formatTimeHHMMSS(3600000)).toBe('01:00:00');
    });

    it('should format hours correctly', () => {
      expect(formatTimeHHMMSS(7200000)).toBe('02:00:00');
    });

    it('should format complex times correctly', () => {
      expect(formatTimeHHMMSS(3723000)).toBe('01:02:03');
      expect(formatTimeHHMMSS(40545000)).toBe('11:15:45');
    });
  });

  describe('formatTimeHuman', () => {
    it('should format zero milliseconds correctly', () => {
      expect(formatTimeHuman(0)).toBe('0s');
    });

    it('should format seconds only correctly', () => {
      expect(formatTimeHuman(5000)).toBe('5s');
      expect(formatTimeHuman(45000)).toBe('45s');
    });

    it('should format minutes correctly', () => {
      expect(formatTimeHuman(60000)).toBe('1m 0s');
      expect(formatTimeHuman(180000)).toBe('3m 0s');
    });

    it('should format hours correctly', () => {
      expect(formatTimeHuman(3600000)).toBe('1h 0m 0s');
      expect(formatTimeHuman(7200000)).toBe('2h 0m 0s');
    });

    it('should format complex times correctly', () => {
      expect(formatTimeHuman(3723000)).toBe('1h 2m 3s');
      expect(formatTimeHuman(40545000)).toBe('11h 15m 45s');
    });

    it('should omit zero hours but include minutes', () => {
      expect(formatTimeHuman(120000)).toBe('2m 0s');
    });
  });
}); 