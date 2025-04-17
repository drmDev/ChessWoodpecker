import 'package:flutter/material.dart';
import '../services/puzzle_service.dart';
import '../services/sound_service.dart';

class SessionScreen extends StatefulWidget {
  final PuzzleService puzzleService;
  final SoundService soundService;

  const SessionScreen({
    super.key,
    required this.puzzleService,
    required this.soundService,
  });

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  final bool _isLoading = true;
  Map<String, List<String>> _puzzleCollections = {};
  String? _selectedTheme;
  int _puzzlesPerSession = 20;
  bool _isSessionActive = false;
  int _currentPuzzleIndex = 0;
  List<String> _currentSessionPuzzles = [];
  List<String> _availableThemes = [];

  @override
  void initState() {
    super.initState();
    _loadPuzzleCollections();
  }

  Future<void> _loadPuzzleCollections() async {
    print('Loading puzzle collections in SessionScreen');
    await widget.puzzleService.loadPuzzleCollections();
    setState(() {
      _puzzleCollections = widget.puzzleService.getPuzzleCollections();
      _availableThemes = widget.puzzleService.getAvailableThemes();
      if (_availableThemes.isNotEmpty) {
        _selectedTheme = _availableThemes.first;
      }
      print('Available themes: ${_availableThemes.join(', ')}');
    });
  }

  void _startSession() {
    print('Starting session with theme: $_selectedTheme');
    if (_selectedTheme == null) {
      print('No theme selected, cannot start session');
      return;
    }

    final puzzles = widget.puzzleService.getPuzzlesForTheme(_selectedTheme!);
    if (puzzles.isEmpty) {
      print('No puzzles found for theme: $_selectedTheme');
      return;
    }

    print('Found ${puzzles.length} puzzles for theme: $_selectedTheme');

    // Shuffle the puzzles and take the first _puzzlesPerSession
    final shuffledPuzzles = List<String>.from(puzzles)..shuffle();
    final sessionPuzzles = shuffledPuzzles.take(_puzzlesPerSession).toList();
    print('Selected ${sessionPuzzles.length} puzzles for this session');

    setState(() {
      _isSessionActive = true;
      _currentPuzzleIndex = 0;
      _currentSessionPuzzles = sessionPuzzles;
    });

    // Play start session sound
    widget.soundService.playSound('start');
    print('Session started successfully');
  }

  void _endSession() {
    setState(() {
      _isSessionActive = false;
      _currentPuzzleIndex = 0;
      _currentSessionPuzzles = [];
    });

    // Play end session sound
    widget.soundService.playSound('end');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Puzzle Sessions'),
        actions: [
          IconButton(
            icon: Icon(widget.soundService.isMuted
                ? Icons.volume_off
                : Icons.volume_up),
            onPressed: () {
              setState(() {
                widget.soundService.toggleMute();
              });
            },
          ),
        ],
      ),
      body: _isSessionActive ? _buildActiveSession() : _buildSessionSetup(),
    );
  }

  Widget _buildSessionSetup() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Select a Theme',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          DropdownButton<String>(
            value: _selectedTheme,
            hint: const Text('Choose a theme'),
            isExpanded: true,
            items: _puzzleCollections.keys.map((theme) {
              return DropdownMenuItem<String>(
                value: theme,
                child: Text(theme.replaceAll('_', ' ').toLowerCase()),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedTheme = value;
              });
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Puzzles per Session',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Slider(
            value: _puzzlesPerSession.toDouble(),
            min: 5,
            max: 50,
            divisions: 9,
            label: _puzzlesPerSession.toString(),
            onChanged: (value) {
              setState(() {
                _puzzlesPerSession = value.round();
              });
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _selectedTheme == null ? null : _startSession,
            child: const Text('Start Session'),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveSession() {
    print('Building active session UI');
    print('Current puzzle index: $_currentPuzzleIndex');
    print('Total puzzles in session: ${_currentSessionPuzzles.length}');

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Session Progress',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        Text(
          'Puzzle ${_currentPuzzleIndex + 1} of ${_currentSessionPuzzles.length}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Theme: ${_selectedTheme?.replaceAll('_', ' ').toLowerCase()}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _endSession,
          child: const Text('End Session'),
        ),
      ],
    );
  }
}
