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
  try {
    // Initialize Audio on mobile
    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
    }

    // Preload all assets
    const assetModules = Object.values(soundModules);
    await preloadAssets(assetModules);

    // Create sound objects
    for (const [name, module] of Object.entries(soundModules)) {
      try {
        // Get the URI for the asset
        const uri = await getAssetUri(module);
        
        if (uri) {
          // Create a sound object from the URI
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { 
              shouldPlay: false,
              volume: 1.0,
              isMuted: false,
            }
          );
          
          loadedSounds[name as SoundName] = sound;
        }
      } catch (e) {
        // Silently handle errors
      }
    }
  } catch (error) {
    // Silently handle errors
  }
};

/**
 * Plays a specific sound
 * @param name The name of the sound to play
 */
export const playSound = async (name: SoundName): Promise<void> => {
  try {
    const sound = loadedSounds[name];
    
    if (sound) {
      // Always reset the position before playing
      await sound.setPositionAsync(0);
      
      // Stop any currently playing instance
      await sound.stopAsync();
      
      // Play the sound
      await sound.playAsync();
    }
  } catch (error) {
    // Silently handle errors
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
          // Silently handle errors
        }
      }
    }
    
    // Clear the cache
    for (const key of Object.keys(loadedSounds)) {
      delete loadedSounds[key as SoundName];
    }
  } catch (error) {
    // Silently handle errors
  }
}; 