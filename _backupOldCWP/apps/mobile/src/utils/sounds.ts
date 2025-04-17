import { Audio } from 'expo-av';
import { preloadAssets, getAssetUri } from './assetLoader';

export const SoundTypes = {
  MOVE: 'move',
  CAPTURE: 'capture',
  CHECK: 'check',
  SUCCESS: 'success',
  FAILURE: 'failure',
  START_SESSION: 'startSession',
  END_SESSION: 'endSession'
} as const;

export type SoundName = typeof SoundTypes[keyof typeof SoundTypes];

const soundModules: Record<SoundName, number> = {
  [SoundTypes.MOVE]: require('../../assets/sounds/Move.mp3'),
  [SoundTypes.CAPTURE]: require('../../assets/sounds/Capture.mp3'),
  [SoundTypes.CHECK]: require('../../assets/sounds/Check.mp3'),
  [SoundTypes.SUCCESS]: require('../../assets/sounds/Success.mp3'),
  [SoundTypes.FAILURE]: require('../../assets/sounds/Failure.mp3'),
  [SoundTypes.START_SESSION]: require('../../assets/sounds/START_zapsplat_retro_coin.mp3'),
  [SoundTypes.END_SESSION]: require('../../assets/sounds/END_zapsplat_coin_collect.mp3')
};

// Cache for loaded sounds
const loadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};

// Track initialization state
let isInitialized = false;
let globalVolume = 1.0;

/**
 * Sets the global volume for all sounds
 * @param volume Volume level between 0 and 1
 */
export function setGlobalVolume(volume: number): void {
  globalVolume = Math.max(0, Math.min(1, volume));
  // Update volume for all loaded sounds
  Object.values(loadedSounds).forEach(sound => {
    sound?.setVolumeAsync(globalVolume);
  });
}

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
    await initializeAudio();    
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
      } catch (_) {
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
    await sound.setVolumeAsync(globalVolume);
    await sound.playAsync();

    // For one-off sounds, unload them after playing
    if (name === SoundTypes.SUCCESS || name === SoundTypes.FAILURE) {
      setTimeout(async () => {
        try {
          await sound!.unloadAsync();
          delete loadedSounds[name];
        } catch (_) {
          // Silently handle errors
        }
      }, 500);
    }
  } catch (_) {
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
        } catch (_) {
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
  } catch (_) {
    // Silently handle errors
  }
}; 