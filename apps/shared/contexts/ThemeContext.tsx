import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, ThemeColors, getTheme } from '../styles/theme';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useColorScheme() as ThemeMode || 'light';
  const [mode, setMode] = useState<ThemeMode>(deviceColorScheme);
  const colors = getTheme(mode);
  const isDark = mode === 'dark';

  // Update theme when device color scheme changes
  useEffect(() => {
    setMode(deviceColorScheme);
  }, [deviceColorScheme]);

  const toggleTheme = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// useTheme is a hook that returns the theme context.
// It is used to access the theme context in the application.
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 