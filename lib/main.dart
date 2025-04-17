import 'package:flutter/material.dart';
import 'package:shared_preferences.dart';
import 'screens/main_screen.dart';
import 'services/puzzle_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final puzzleService = PuzzleService(prefs);
  
  runApp(ChessWoodpeckerApp(puzzleService: puzzleService));
}

class ChessWoodpeckerApp extends StatelessWidget {
  final PuzzleService puzzleService;

  const ChessWoodpeckerApp({
    Key? key,
    required this.puzzleService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chess Woodpecker',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: MainScreen(puzzleService: puzzleService),
    );
  }
}
