import { Asset } from 'expo-asset';
import { preloadAssets, getAssetUri } from '../assetLoader';

jest.mock('expo-asset');

describe('assetLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('preloadAssets', () => {
    it('should call Asset.loadAsync with provided assets', async () => {
      const mockAssets = [1, 2, 3];
      await preloadAssets(mockAssets);
      expect(Asset.loadAsync).toHaveBeenCalledWith(mockAssets);
    });

    it('should not throw error when Asset.loadAsync fails', async () => {
      (Asset.loadAsync as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));
      await expect(preloadAssets([1])).resolves.not.toThrow();
    });
  });

  describe('getAssetUri', () => {
    it('should return uri when asset is successfully downloaded', async () => {
      const mockUri = 'file://mock/asset.png';
      const mockAsset = { downloadAsync: jest.fn().mockResolvedValue({ uri: mockUri }) };
      (Asset.fromModule as jest.Mock).mockReturnValue(mockAsset);

      const result = await getAssetUri(1);
      expect(result).toBe(mockUri);
      expect(Asset.fromModule).toHaveBeenCalledWith(1);
    });

    it('should return null when asset download fails', async () => {
      const mockAsset = { downloadAsync: jest.fn().mockRejectedValue(new Error('Download failed')) };
      (Asset.fromModule as jest.Mock).mockReturnValue(mockAsset);

      const result = await getAssetUri(1);
      expect(result).toBeNull();
    });

    it('should return null when downloaded asset has no uri', async () => {
      const mockAsset = { downloadAsync: jest.fn().mockResolvedValue({ uri: null }) };
      (Asset.fromModule as jest.Mock).mockReturnValue(mockAsset);

      const result = await getAssetUri(1);
      expect(result).toBeNull();
    });
  });
}); 