import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { preloadAssets, getAssetUri } from './assetLoader';

// Define sound types
export type SoundName = 'move' | 'capture' | 'check' | 'success' | 'failure';

// Map of sound names to their require statements
const soundModules: Record<SoundName, number> = {
  move: require('../../assets/sounds/Move.mp3'),
  capture: require('../../assets/sounds/Capture.mp3'),
  check: require('../../assets/sounds/Check.mp3'),
  success: require('../../assets/sounds/Success.mp3'),
  failure: require('../../assets/sounds/Failure.mp3')
};

// Cache for loaded sounds
const loadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};

/**
 * Loads all sound files into memory
 */
export const loadSounds = async (): Promise<void> => {
  console.log('Loading sounds...');
  try {
    // Initialize Audio on mobile
    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      console.log('Audio mode set');
    }

    // Create sound objects directly without preloading
    for (const [name, module] of Object.entries(soundModules)) {
      try {
        console.log(`Loading sound: ${name}`);
        
        // Create a sound object directly from the module
        const { sound } = await Audio.Sound.createAsync(module);
        
        loadedSounds[name as SoundName] = sound;
        console.log(`Sound ${name} loaded successfully`);
      } catch (e) {
        console.error(`Error loading sound ${name}:`, e);
      }
    }
    console.log('All sounds loaded:', Object.keys(loadedSounds));
  } catch (error) {
    console.error('Error in loadSounds:', error);
  }
};

/**
 * Plays a specific sound
 * @param name The name of the sound to play
 */
export const playSound = async (name: SoundName): Promise<void> => {
  try {
    console.log(`Attempting to play sound: ${name}`);
    const sound = loadedSounds[name];
    
    if (sound) {
      // Reset position and play
      await sound.setPositionAsync(0);
      await sound.playAsync();
      console.log(`Sound ${name} played`);
    } else {
      // If sound isn't loaded, try to load and play it directly
      console.log(`Sound ${name} not loaded, loading now`);
      const module = soundModules[name];
      if (module) {
        const { sound: newSound } = await Audio.Sound.createAsync(module, { shouldPlay: true });
        loadedSounds[name] = newSound;
        console.log(`Sound ${name} loaded and played`);
      }
    }
  } catch (error) {
    console.error(`Error playing sound ${name}:`, error);
  }
};

/**
 * Unloads all sounds from memory
 */
export const unloadSounds = async (): Promise<void> => {
  try {
    for (const [name, sound] of Object.entries(loadedSounds)) {
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          console.error(`Error unloading sound ${name}:`, e);
        }
      }
    }
    
    // Clear the cache
    for (const key of Object.keys(loadedSounds)) {
      delete loadedSounds[key as SoundName];
    }
    console.log('All sounds unloaded');
  } catch (error) {
    console.error('Error in unloadSounds:', error);
  }
}; 