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

// Track initialization state
let isInitialized = false;

/**
 * Initializes the audio system
 */
async function initializeAudio(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    isInitialized = true;
  } catch (error) {
    throw error;
  }
}

/**
 * Loads all sound files into memory
 */
export const loadSounds = async (): Promise<void> => {
  try {
    // Initialize audio system first
    await initializeAudio();
    
    // Preload all sound assets
    const soundAssets = Object.values(soundModules);
    await preloadAssets(soundAssets);
    
    // Create sound objects
    for (const [name, module] of Object.entries(soundModules)) {
      try {
        // Get the asset URI
        const uri = await getAssetUri(module);
        if (!uri) continue;
        
        // Create a sound object
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, volume: 1.0 }
        );
        
        loadedSounds[name as SoundName] = sound;
      } catch (e) {
        // Silently handle errors for individual sounds
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Plays a specific sound
 * @param name The name of the sound to play
 */
export const playSound = async (name: SoundName): Promise<void> => {
  // Create a new promise that resolves after the sound is played
  return new Promise((resolve) => {
    // Use setTimeout with a delay to break out of the current execution context
    setTimeout(async () => {
      try {
        // Try to recreate the sound object each time
        try {
          // Get the asset URI
          const uri = await getAssetUri(soundModules[name]);
          if (!uri) {
            resolve();
            return;
          }
          
          // Create a fresh sound object each time
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false, volume: 1.0 }
          );
          
          // Store the new sound object
          loadedSounds[name] = sound;
          
          // Play immediately
          await sound.playAsync();
          
          // Add a delay to ensure the sound has time to be heard
          await new Promise(r => setTimeout(r, 200));
          
          // Unload after playing to prevent resource issues
          await sound.unloadAsync();
          
        } catch (createError) {
          // Fall back to existing sound if available
          let sound = loadedSounds[name];
          
          if (!sound) {
            await loadSounds();
            sound = loadedSounds[name];
            
            if (!sound) {
              throw new Error(`Failed to load sound ${name}`);
            }
          }
          
          // Try to get the status
          const status = await sound.getStatusAsync();
          
          // If sound is already playing, stop it first
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
          }
          
          // Reset position and play with maximum volume
          await sound.setPositionAsync(0);
          await sound.setVolumeAsync(1.0);
          
          await sound.playAsync();
          
          // Add a delay to ensure the sound has time to be heard
          await new Promise(r => setTimeout(r, 200));
        }
        
        resolve();
      } catch (error) {
        resolve();
      }
    }, 100); // Longer delay to ensure we're out of any gesture context
  });
};

/**
 * Unloads all sounds from memory
 */
export const unloadSounds = async (): Promise<void> => {
  try {
    for (const [name, sound] of Object.entries(loadedSounds)) {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.stopAsync();
            }
            await sound.unloadAsync();
          }
        } catch (e) {
          // Silently handle errors for individual sounds
        }
      }
    }
    
    // Clear the cache
    for (const key of Object.keys(loadedSounds)) {
      delete loadedSounds[key as SoundName];
    }
    
    // Reset initialization state
    isInitialized = false;
  } catch (error) {
    // Silently handle errors
  }
}; 