import 'package:flutter/services.dart';

class SoundService {
  static final SoundService _instance = SoundService._internal();
  factory SoundService() => _instance;
  SoundService._internal();

  final Map<String, ByteData> _soundData = {};
  bool _isMuted = false;

  Future<void> loadSounds() async {
    final soundFiles = {
      'move': 'assets/sounds/Move.mp3',
      'capture': 'assets/sounds/Capture.mp3',
      'check': 'assets/sounds/Check.mp3',
      'success': 'assets/sounds/Success.mp3',
      'failure': 'assets/sounds/Failure.mp3',
      'start': 'assets/sounds/START_zapsplat_retro_coin.mp3',
      'end': 'assets/sounds/END_zapsplat_coin_collect.mp3',
    };

    for (final entry in soundFiles.entries) {
      try {
        _soundData[entry.key] = await rootBundle.load(entry.value);
      } catch (e) {
        print('Error loading sound ${entry.key}: $e');
      }
    }
  }

  Future<void> playSound(String soundName) async {
    if (_isMuted) return;

    final soundData = _soundData[soundName];
    if (soundData == null) {
      print('Sound $soundName not found');
      return;
    }

    try {
      // In a real app, you would use a proper audio player package
      // For now, we'll just print that we would play the sound
      print('Playing sound: $soundName');

      // Example of how you would play the sound with a proper audio package:
      // final player = AudioPlayer();
      // await player.play(ByteSource(soundData.buffer.asUint8List()));
    } catch (e) {
      print('Error playing sound $soundName: $e');
    }
  }

  void toggleMute() {
    _isMuted = !_isMuted;
  }

  bool get isMuted => _isMuted;
}
