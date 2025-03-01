import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const PuzzlesScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  
  return (
    <ScrollView 
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          shadowColor: isDark ? '#000' : colors.primary,
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.highlight }]}>
            <Ionicons name="grid" size={48} color={colors.accent} style={styles.icon} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Puzzle Collections</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Coming soon! You'll be able to manage your puzzle collections here.
          </Text>
          <View style={styles.featuresContainer}>
            <FeatureItem 
              icon="folder-outline" 
              title="Organize Puzzles" 
              description="Create and manage collections of chess puzzles"
              colors={colors}
            />
            <FeatureItem 
              icon="download-outline" 
              title="Import Puzzles" 
              description="Import puzzles from PGN files or online sources"
              colors={colors}
            />
            <FeatureItem 
              icon="analytics-outline" 
              title="Track Progress" 
              description="Monitor your improvement across different puzzle types"
              colors={colors}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

interface FeatureItemProps {
  icon: any; // Using any to avoid TypeScript errors with Ionicons names
  title: string;
  description: string;
  colors: any;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colors }) => {
  return (
    <View style={[styles.featureItem, { borderColor: colors.border }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: colors.highlight }]}>
        <Ionicons name={icon} size={24} color={colors.accent} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 