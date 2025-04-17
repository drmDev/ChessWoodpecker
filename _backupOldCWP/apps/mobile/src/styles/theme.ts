export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  accent: string;
  highlight: string;
}

export const lightTheme: ThemeColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  primary: '#2196F3',
  secondary: '#4CAF50',
  text: '#212121',
  textSecondary: '#757575',
  border: '#e0e0e0',
  error: '#f44336',
  success: '#4caf50',
  warning: '#FFC107',
  accent: '#FF9800',
  highlight: '#E1F5FE',
};

export const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#90CAF9',
  secondary: '#81C784',
  text: '#e0e0e0',
  textSecondary: '#b0b0b0',
  border: '#333333',
  error: '#ef5350',
  success: '#66BB6A',
  warning: '#FFB300',
  accent: '#FFB74D',
  highlight: '#263238',
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === 'light' ? lightTheme : darkTheme;
}; 