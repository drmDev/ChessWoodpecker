import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { SoundName, SoundPlayer, soundFiles } from '../../../shared/utils/sounds';

// Import sound files statically
const getSoundModule = (filename: string) => {
  switch (filename) {
    case 'Move.mp3':
      return require('../../assets/sounds/Move.mp3');
    case 'Capture.mp3':
      return require('../../assets/sounds/Capture.mp3');
    case 'Check.mp3':
      return require('../../assets/sounds/Check.mp3');
    case 'Success.mp3':
      return require('../../assets/sounds/Success.mp3');
    case 'Failure.mp3':
      return require('../../assets/sounds/Failure.mp3');
    default:
      throw new Error(`Unknown sound file: ${filename}`);
  }
};

// Cache for loaded sounds
const loadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};

// Mobile implementation of SoundPlayer
const MobileSoundPlayer: SoundPlayer = {
  // Load all sounds
  loadSounds: async () => {
    try {
      console.log('Loading sounds...');

      // Initialize Audio on mobile
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
      }

      for (const [name, filename] of Object.entries(soundFiles)) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            getSoundModule(filename),
            { 
              shouldPlay: false,
              volume: 1.0,
              isMuted: false,
            }
          );
          loadedSounds[name as SoundName] = sound;
          console.log(`Loaded sound: ${name}`);
        } catch (e) {
          console.error(`Error loading sound ${name}:`, e);
        }
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
        // Always reset the position before playing
        await sound.setPositionAsync(0);
        
        // Stop any currently playing instance
        await sound.stopAsync();
        
        // Play the sound
        await sound.playAsync();
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
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
            console.log(`Unloaded sound: ${name}`);
          } catch (e) {
            console.error(`Error unloading sound ${name}:`, e);
          }
        }
      }
      
      // Clear the cache
      for (const key of Object.keys(loadedSounds)) {
        delete loadedSounds[key as SoundName];
      }
      
      console.log('All sounds unloaded successfully');
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }
};

// Export the mobile implementation functions directly
export const { loadSounds, playSound, unloadSounds } = MobileSoundPlayer; 