module.exports = {
  name: 'ChessWoodpecker',
  slug: 'chess-woodpecker',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.derekmonturo.chesswoodpecker",
    buildNumber: "1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: "com.derekmonturo.chesswoodpecker"
  },
  extra: {
    eas: {
      projectId: "081aafe2-8f30-4f29-aa87-5854a716e188"
    }
  }
}; 