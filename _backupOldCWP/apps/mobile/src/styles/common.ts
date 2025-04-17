import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  icon: {
    marginRight: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowSpaceBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}); 