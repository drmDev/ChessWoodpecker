import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, ThemeMode, getTheme } from '../styles/theme';

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const deviceTheme = useColorScheme() as ThemeMode || 'light';
  const [themeMode, setThemeMode] = useState<ThemeMode>(deviceTheme);
  const [theme, setTheme] = useState<ThemeColors>(getTheme(themeMode));

  // Update theme when themeMode changes
  useEffect(() => {
    setTheme(getTheme(themeMode));
  }, [themeMode]);

  // Listen for device theme changes
  useEffect(() => {
    if (deviceTheme) {
      setThemeMode(deviceTheme);
    }
  }, [deviceTheme]);

  const toggleTheme = () => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 