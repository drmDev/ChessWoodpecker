import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Error boundary component to catch rendering errors
 * Used as a safety net for rendering failures in any part of the app
 */
export const ErrorBoundary = React.memo(
  class ErrorBoundaryClass extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
            <Text style={styles.errorHint}>Please try again later.</Text>
          </View>
        );
      }

      return this.props.children;
    }
  }
);

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  errorHint: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  errorText: {
    color: '#2c3e50',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#e74c3c',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 