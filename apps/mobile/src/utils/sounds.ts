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
  } catch (_error) {
    throw _error;
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
      } catch (_e) {
        // Silently handle errors for individual sounds
      }
    }
  } catch (_error) {
    throw _error;
  }
};

/**
 * Plays a specific sound and returns a promise that resolves when the sound finishes
 * @param name The name of the sound to play
 */
export const playSound = async (name: SoundName): Promise<void> => {
  try {
    // Get or create the sound object
    let sound = loadedSounds[name];
    if (!sound) {
      // Get the asset URI
      const uri = await getAssetUri(soundModules[name]);
      if (!uri) return;
      
      // Create a fresh sound object
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: 1.0 }
      );
      sound = newSound;
      loadedSounds[name] = sound;
    }

    // Get current status
    const status = await sound.getStatusAsync();
    
    // If sound is already playing, stop it
    if (status.isLoaded && status.isPlaying) {
      await sound.stopAsync();
    }

    // Reset position and play
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(1.0);
    
    // Play the sound and wait for it to finish
    await new Promise<void>((resolve) => {
      sound!.playAsync()
        .then(() => {
          // Wait for the sound duration plus a small buffer
          setTimeout(async () => {
            try {
              // Only unload if it's a one-off sound like success/failure
              if (name === 'success' || name === 'failure') {
                await sound!.unloadAsync();
                delete loadedSounds[name];
              }
            } finally {
              resolve();
            }
          }, 500); // Increased buffer time to ensure sound completes
        })
        .catch(() => resolve()); // Resolve on error to prevent hanging
    });
  } catch (_error) {
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
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.stopAsync();
            }
            await sound.unloadAsync();
          }
        } catch (_e) {
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
  } catch (_error) {
    // Silently handle errors
  }
}; 