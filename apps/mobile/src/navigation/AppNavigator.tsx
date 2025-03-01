import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainScreen } from '../screens/MainScreen';
import { PuzzlesScreen } from '../../../shared/screens/PuzzlesScreen';
import { useTheme } from '../../../shared/contexts/ThemeContext';

// Define the tab navigator param list
type TabParamList = {
  Practice: undefined;
  Puzzles: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {} as Theme['fonts'], // Add empty fonts object to satisfy the type
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any = '';

            if (route.name === 'Practice') {
              iconName = focused ? 'play-circle' : 'play-circle-outline';
            } else if (route.name === 'Puzzles') {
              iconName = focused ? 'grid' : 'grid-outline';
            }

            // Use a simple approach without nested Views to avoid pointerEvents issues
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            elevation: 8,
            shadowColor: isDark ? '#000' : colors.primary,
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            height: 60,
            paddingBottom: 8,
          },
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            elevation: 4,
            shadowColor: isDark ? '#000' : colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.primary,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 4,
          },
        })}
      >
        <Tab.Screen 
          name="Practice" 
          component={MainScreen}
          options={{
            title: 'Woodpecker',
          }}
        />
        <Tab.Screen 
          name="Puzzles" 
          component={PuzzlesScreen}
          options={{
            title: 'Puzzles',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 