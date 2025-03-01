import { SoundName, SoundPlayer, soundFiles } from '../shared/utils/sounds';

// Cache for loaded sounds
const loadedSounds: Record<SoundName, HTMLAudioElement | null> = {
  move: null,
  capture: null,
  check: null,
  success: null,
  failure: null
};

// Sound file paths for web
const getSoundPath = (filename: string): string => `/sounds/${filename}`;

// Web implementation of SoundPlayer
const WebSoundPlayer: SoundPlayer = {
  // Load all sounds
  loadSounds: async () => {
    try {
      for (const [name, filename] of Object.entries(soundFiles)) {
        const audio = new Audio(getSoundPath(filename));
        audio.preload = 'auto';
        loadedSounds[name as SoundName] = audio;
      }
    } catch (error) {
      // Silently handle errors
    }
  },

  // Play a specific sound
  playSound: async (name: SoundName) => {
    try {
      const sound = loadedSounds[name];
      
      if (sound) {
        // Reset the sound to the beginning
        sound.currentTime = 0;
        
        // Play the sound
        await sound.play();
      }
    } catch (error) {
      // Silently handle errors
    }
  },

  // Unload all sounds when they're no longer needed
  unloadSounds: async () => {
    try {
      for (const [name, sound] of Object.entries(loadedSounds)) {
        if (sound) {
          sound.pause();
          sound.src = '';
          loadedSounds[name as SoundName] = null;
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  }
};

// Export the web implementation functions directly
export const { loadSounds, playSound, unloadSounds } = WebSoundPlayer; 