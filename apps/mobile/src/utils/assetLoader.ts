import { Asset } from 'expo-asset';

/**
 * Preloads assets to ensure they're available when needed
 * @param assets Array of asset modules to preload
 */
export const preloadAssets = async (assets: number[]): Promise<void> => {
  try {
    await Asset.loadAsync(assets);
  } catch (_error) {
    // Silently handle errors
  }
};

/**
 * Gets the URI for an asset
 * @param asset Asset module
 * @returns URI for the asset
 */
export const getAssetUri = async (asset: number): Promise<string | null> => {
  try {
    const downloadedAsset = await Asset.fromModule(asset).downloadAsync();
    return downloadedAsset?.uri || null;
  } catch (_error) {
    return null;
  }
}; 