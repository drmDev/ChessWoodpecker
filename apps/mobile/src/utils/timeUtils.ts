/**
 * Formats milliseconds into HH:mm:ss format
 * @param milliseconds Time in milliseconds
 * @returns Formatted time string in HH:mm:ss format
 */
export const formatTimeHHMMSS = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

/**
 * Formats milliseconds into a human-readable format (e.g., "2h 30m 15s")
 * @param milliseconds Time in milliseconds
 * @returns Human-readable time string
 */
export const formatTimeHuman = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }
  
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}; 