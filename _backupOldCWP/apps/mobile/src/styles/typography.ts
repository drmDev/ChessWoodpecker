import { StyleSheet, Platform } from 'react-native';

export const typography = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  monospace: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 