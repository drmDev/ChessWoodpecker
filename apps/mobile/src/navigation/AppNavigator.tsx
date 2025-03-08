import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainScreen } from '../screens/MainScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import { TouchableOpacity } from 'react-native';

// Define the tab navigator param list
type TabParamList = {
  Home: undefined;
  Stats: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const AppNavigator: React.FC = () => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const navigationRef = useRef<any>(null);

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
    <NavigationContainer theme={navigationTheme} ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Stats') {
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
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
          name="Stats"
          component={SessionSummaryScreen}
          options={({ navigation }) => ({
            title: 'Session Stats',
            headerShown: true,
            // Add a close button to the header
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => navigation.navigate('Home' as never)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            ),
          })}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};