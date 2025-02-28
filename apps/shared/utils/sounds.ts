export type SoundName = 'move' | 'capture' | 'check' | 'success' | 'failure';

// This is a platform-agnostic interface for sound operations
export interface SoundPlayer {
  loadSounds: () => Promise<void>;
  playSound: (name: SoundName) => Promise<void>;
  unloadSounds: () => Promise<void>;
}

// Sound file names (without paths)
export const soundFiles: Record<SoundName, string> = {
  move: 'Move.mp3',
  capture: 'Capture.mp3',
  check: 'Check.mp3',
  success: 'Success.mp3',
  failure: 'Failure.mp3'
}; 