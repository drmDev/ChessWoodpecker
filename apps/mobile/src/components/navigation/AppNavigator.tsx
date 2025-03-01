import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MainScreen } from '../../screens/MainScreen';
import { PuzzlesScreen } from '../../../../shared/screens/PuzzlesScreen';
import { useTheme } from '../../../../shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type Screen = 'main' | 'puzzles';

export const AppNavigator: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('main');
  const { colors, mode, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  
  const renderScreen = () => {
    switch (activeScreen) {
      case 'main':
        return <MainScreen />;
      case 'puzzles':
        return <PuzzlesScreen />;
      default:
        return <MainScreen />;
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Chess Woodpecker</Text>
        <TouchableOpacity 
          style={styles.themeToggle} 
          onPress={toggleTheme}
        >
          <Ionicons 
            name={mode === 'dark' ? 'sunny' : 'moon'} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeScreen === 'main' && [styles.activeTab, { borderTopColor: colors.primary }]]}
          onPress={() => setActiveScreen('main')}
        >
          <Ionicons 
            name="home" 
            size={22} 
            color={activeScreen === 'main' ? colors.primary : colors.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: colors.textSecondary },
              activeScreen === 'main' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeScreen === 'puzzles' && [styles.activeTab, { borderTopColor: colors.primary }]]}
          onPress={() => setActiveScreen('puzzles')}
        >
          <Ionicons 
            name="grid" 
            size={22} 
            color={activeScreen === 'puzzles' ? colors.primary : colors.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: colors.textSecondary },
              activeScreen === 'puzzles' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            Puzzles
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderTopWidth: 2,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
}); 