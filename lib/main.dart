import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/main_screen.dart';
import 'screens/session_screen.dart';
import 'services/puzzle_service.dart';
import 'services/sound_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final puzzleService = PuzzleService(prefs);
  final soundService = SoundService();

  // Load sounds and puzzle collections
  print('Initializing app services...');
  await Future.wait([
    soundService.loadSounds(),
    puzzleService.loadPuzzleCollections(),
  ]);
  print('App services initialized successfully');

  runApp(ChessWoodpeckerApp(
    puzzleService: puzzleService,
    soundService: soundService,
  ));
}

class ChessWoodpeckerApp extends StatelessWidget {
  final PuzzleService puzzleService;
  final SoundService soundService;

  const ChessWoodpeckerApp({
    super.key,
    required this.puzzleService,
    required this.soundService,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chess Woodpecker',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: HomeScreen(
        puzzleService: puzzleService,
        soundService: soundService,
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  final PuzzleService puzzleService;
  final SoundService soundService;

  const HomeScreen({
    super.key,
    required this.puzzleService,
    required this.soundService,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [];

  @override
  void initState() {
    super.initState();
    _screens.addAll([
      MainScreen(
        puzzleService: widget.puzzleService,
        soundService: widget.soundService,
      ),
      SessionScreen(
        puzzleService: widget.puzzleService,
        soundService: widget.soundService,
      ),
    ]);
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.sports_esports),
            label: 'Puzzles',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.timer),
            label: 'Sessions',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
      ),
    );
  }
}
