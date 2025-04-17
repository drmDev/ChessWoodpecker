import { StyleSheet } from 'react-native';

// Shared styles that can be used across components
export const sharedStyles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionContainer: {
    flex: 1,
    margin: 16,
  },
  welcomeContainer: {
    borderRadius: 8,
    borderWidth: 1,
    margin: 16,
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
});