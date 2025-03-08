// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add mp3 to asset extensions
if (!config.resolver.assetExts.includes('mp3')) {
  config.resolver.assetExts.push('mp3');
}

// Configure path aliases (removed shared reference)
config.resolver.extraNodeModules = {
  // All shared code is now in the mobile app
};

// Remove watchFolders configuration that referenced shared
// config.watchFolders = [path.resolve(__dirname, '../shared')];

module.exports = config; 