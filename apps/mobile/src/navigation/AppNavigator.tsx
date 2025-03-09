import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainScreen } from '../screens/MainScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';
import { useTheme } from '../contexts/ThemeContext';
import { TouchableOpacity } from 'react-native';
import { DebugScreen } from '../screens/DebugScreen';

// Define the tab navigator param list
type TabParamList = {
  Home: undefined;
  Stats: undefined;
  TestBoard: undefined;
  Debug: undefined;
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
            } else if (route.name === 'TestBoard') {
              iconName = focused ? 'test-analysis' : 'test-analysis-outline';
            } else if (route.name === 'Debug') {
              iconName = focused ? 'bug' : 'bug-outline';
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
        <Tab.Screen
          name="Debug"
          component={DebugScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'bug' : 'bug-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};