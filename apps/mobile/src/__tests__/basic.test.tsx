import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// A simple component to test
const SimpleComponent = () => (
  <View>
    <Text>Hello, World!</Text>
  </View>
);

describe('Basic Component Test', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Hello, World!')).toBeTruthy();
  });

  it('basic test works', () => {
    expect(1 + 1).toBe(2);
  });
}); 