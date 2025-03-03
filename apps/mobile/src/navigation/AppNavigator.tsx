import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainScreen } from '../screens/MainScreen';
import { LichessApiTestScreen } from '../screens/LichessApiTestScreen';
import { useTheme } from '../contexts/ThemeContext';

// Define the tab navigator param list
type TabParamList = {
  Home: undefined;
  LichessApiTest: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const AppNavigator: React.FC = () => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Create navigation theme based on app theme
  const navigationTheme: Theme = {
    dark: isDark,
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.accent,
    },
    fonts: {} as Theme['fonts'], // Add empty fonts object to satisfy the type
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string = '';

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'LichessApiTest') {
              iconName = focused ? 'code-working' : 'code-slash-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
          headerStyle: {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            borderBottomWidth: 1,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={MainScreen} 
          options={{ 
            title: 'Chess Woodpecker',
            headerShown: false,
          }} 
        />
        <Tab.Screen 
          name="LichessApiTest" 
          component={LichessApiTestScreen} 
          options={{ 
            title: 'Lichess API Test',
            headerShown: true,
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 