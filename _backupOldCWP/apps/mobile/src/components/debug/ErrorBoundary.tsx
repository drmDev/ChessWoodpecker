import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component to catch and display errors in the UI
 * This helps prevent the app from crashing completely and provides
 * useful debugging information
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render error information
      return (
        <View style={styles.container}>
          <Text style={styles.header}>Something went wrong</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.errorText}>
              {this.state.error?.toString()}
            </Text>
            <Text style={styles.stackText}>
              {this.state.errorInfo?.componentStack || 'No component stack available'}
            </Text>
          </ScrollView>
        </View>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    flex: 1,
    padding: 20,
  },
  errorText: {
    color: '#721c24',
    fontSize: 16,
    marginBottom: 10,
  },
  header: {
    color: '#721c24',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  stackText: {
    color: '#721c24',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});

export default ErrorBoundary; 