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
      console.log('Loading sounds...');
      
      for (const [name, filename] of Object.entries(soundFiles)) {
        const audio = new Audio(getSoundPath(filename));
        audio.preload = 'auto';
        loadedSounds[name as SoundName] = audio;
        console.log(`Loaded sound: ${name}`);
      }
      
      console.log('All sounds loaded successfully');
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  },

  // Play a specific sound
  playSound: async (name: SoundName) => {
    try {
      console.log(`Attempting to play sound: ${name}`);
      const sound = loadedSounds[name];
      
      if (sound) {
        // Reset the sound to the beginning
        sound.currentTime = 0;
        
        // Play the sound
        await sound.play();
        console.log(`Sound played successfully: ${name}`);
      } else {
        console.warn(`Sound not loaded: ${name}`);
      }
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
    }
  },

  // Unload all sounds when they're no longer needed
  unloadSounds: async () => {
    try {
      console.log('Unloading sounds...');
      
      for (const [name, sound] of Object.entries(loadedSounds)) {
        if (sound) {
          sound.pause();
          sound.src = '';
          loadedSounds[name as SoundName] = null;
          console.log(`Unloaded sound: ${name}`);
        }
      }
      
      console.log('All sounds unloaded successfully');
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }
};

// Export the web implementation functions directly
export const { loadSounds, playSound, unloadSounds } = WebSoundPlayer; 