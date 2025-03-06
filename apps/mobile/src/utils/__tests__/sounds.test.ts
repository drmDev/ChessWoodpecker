import { Audio } from 'expo-av';
import { preloadAssets, getAssetUri } from '../assetLoader';
import { SoundTypes, setGlobalVolume, loadSounds, playSound, unloadSounds } from '../sounds';

jest.mock('expo-av');
jest.mock('../assetLoader');

describe('sounds', () => {
    let mockSound: any;
    let originalSetTimeout: typeof setTimeout;

    beforeEach(() => {
        // Store original setTimeout
        originalSetTimeout = global.setTimeout;

        jest.clearAllMocks();
        mockSound = {
            playAsync: jest.fn().mockResolvedValue(undefined),
            stopAsync: jest.fn().mockResolvedValue(undefined),
            unloadAsync: jest.fn().mockResolvedValue(undefined),
            setPositionAsync: jest.fn().mockResolvedValue(undefined),
            setVolumeAsync: jest.fn().mockResolvedValue(undefined),
            getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false }),
        };

        // Set up default mock implementations
        (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });
        (Audio.setAudioModeAsync as jest.Mock).mockImplementation(async (config) => {
            // Validate that the config matches what we expect
            if (config.playsInSilentModeIOS !== true ||
                config.staysActiveInBackground !== false ||
                config.shouldDuckAndroid !== false ||
                config.playThroughEarpieceAndroid !== false) {
                throw new Error('Invalid audio config');
            }
            return undefined;
        });
        (getAssetUri as jest.Mock).mockResolvedValue('mock-uri');
        (preloadAssets as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
        // Reset initialization state
        unloadSounds();
    });

    describe('setGlobalVolume', () => {
        it('should clamp volume between 0 and 1', async () => {
            await loadSounds();
            mockSound.setVolumeAsync.mockClear();

            setGlobalVolume(-0.5);
            expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0);

            mockSound.setVolumeAsync.mockClear();

            setGlobalVolume(1.5);
            expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(1);
        });
    });

    describe('loadSounds', () => {
        it('should initialize audio and preload assets', async () => {
            await loadSounds();

            expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            });
            expect(preloadAssets).toHaveBeenCalled();
        });

        it('should create sound objects for each sound type', async () => {
            await loadSounds();

            expect(getAssetUri).toHaveBeenCalledTimes(Object.keys(SoundTypes).length);
            expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(Object.keys(SoundTypes).length);
        });

        it('should handle errors gracefully', async () => {
            const errorToThrow = new Error('Failed to initialize');
            (Audio.setAudioModeAsync as jest.Mock).mockImplementationOnce(async () => {
                throw errorToThrow;
            });
            
            await expect(loadSounds()).rejects.toThrow('Failed to initialize');
        });
    });

    describe('playSound', () => {
        beforeEach(async () => {
            await loadSounds();

            jest.spyOn(global, 'setTimeout').mockImplementation((callback: Function, _timeout?: number) => {
                callback();
                return 999 as any;
            });
        });

        it('should play a loaded sound', async () => {
            await playSound(SoundTypes.MOVE);

            expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
            expect(mockSound.setVolumeAsync).toHaveBeenCalled();
            expect(mockSound.playAsync).toHaveBeenCalled();
        });

        it('should stop playing sound before replaying', async () => {
            mockSound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: true });
            await playSound(SoundTypes.MOVE);

            expect(mockSound.stopAsync).toHaveBeenCalled();
        });

        it('should create new sound if not loaded', async () => {
            await unloadSounds();
            await playSound(SoundTypes.MOVE);

            expect(Audio.Sound.createAsync).toHaveBeenCalled();
        });

        it('should unload one-off sounds after playing', async () => {
            mockSound.unloadAsync.mockClear();

            await playSound(SoundTypes.SUCCESS);

            expect(mockSound.unloadAsync).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockSound.playAsync.mockRejectedValueOnce(new Error('Failed to play'));
            await expect(playSound(SoundTypes.MOVE)).resolves.not.toThrow();
        });
    });

    describe('unloadSounds', () => {
        beforeEach(async () => {
            await loadSounds();
        });

        it('should unload all sounds', async () => {
            await unloadSounds();
            expect(mockSound.unloadAsync).toHaveBeenCalled();
        });

        it('should stop playing sounds before unloading', async () => {
            mockSound.getStatusAsync.mockResolvedValueOnce({ isLoaded: true, isPlaying: true });
            await unloadSounds();
            expect(mockSound.stopAsync).toHaveBeenCalled();
            expect(mockSound.unloadAsync).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockSound.unloadAsync.mockRejectedValueOnce(new Error('Failed to unload'));
            await expect(unloadSounds()).resolves.not.toThrow();
        });
    });
});