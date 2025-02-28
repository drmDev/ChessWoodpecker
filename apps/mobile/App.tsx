import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ChessBoard } from './src/components/chess/ChessBoard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Configure reanimated logger to disable strict mode
configureReanimatedLogger({
  level: ReanimatedLogLevel.error, // Only show errors, not warnings
  strict: false, // Disable strict mode
});

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <ChessBoard />
        <StatusBar style="auto" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
