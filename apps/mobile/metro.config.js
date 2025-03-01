// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add mp3 to asset extensions
if (!config.resolver.assetExts.includes('mp3')) {
  config.resolver.assetExts.push('mp3');
}

// Configure path aliases
config.resolver.extraNodeModules = {
  '@shared': path.resolve(__dirname, '../shared'),
};

// Add the shared directory to watchFolders
config.watchFolders = [path.resolve(__dirname, '../shared')];

module.exports = config; 