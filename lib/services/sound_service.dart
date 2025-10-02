import 'package:audioplayers/audioplayers.dart';

class SoundService {
  static final SoundService _instance = SoundService._internal();
  factory SoundService() => _instance;
  SoundService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  final Map<String, String> _soundPaths = {};
  bool _isMuted = false;

  Future<void> loadSounds() async {
    _soundPaths.addAll({
      'move': 'sounds/Move.mp3',
      'capture': 'sounds/Capture.mp3',
      'check': 'sounds/Check.mp3',
      'success': 'sounds/Success.mp3',
      'failure': 'sounds/Failure.mp3',
      'start': 'sounds/START_zapsplat_retro_coin.mp3',
      'end': 'sounds/END_zapsplat_coin_collect.mp3',
    });
    
    print('Sound service initialized with ${_soundPaths.length} sounds');
  }

  Future<void> playSound(String soundName) async {
    if (_isMuted) {
      print('Sound muted: $soundName');
      return;
    }

    final soundPath = _soundPaths[soundName];
    if (soundPath == null) {
      print('Sound $soundName not found in sound paths');
      return;
    }

    try {
      print('Playing sound: $soundName from $soundPath');
      await _audioPlayer.play(AssetSource(soundPath));
    } catch (e) {
      print('Error playing sound $soundName: $e');
    }
  }

  void toggleMute() {
    _isMuted = !_isMuted;
    print('Sound ${_isMuted ? 'muted' : 'unmuted'}');
  }

  bool get isMuted => _isMuted;
  
  void dispose() {
    _audioPlayer.dispose();
  }
}
