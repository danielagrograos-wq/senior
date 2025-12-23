import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface MatchBadgeProps {
  score: number;
  size?: 'small' | 'large';
}

export function MatchBadge({ score, size = 'small' }: MatchBadgeProps) {
  const getColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary[500];
    if (score >= 40) return colors.warning;
    return colors.textMuted;
  };

  const color = getColor();
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, { backgroundColor: color + '20' }, isLarge && styles.containerLarge]}>
      <Ionicons name="heart" size={isLarge ? 16 : 12} color={color} />
      <Text style={[styles.text, { color }, isLarge && styles.textLarge]}>
        {Math.round(score)}% Match
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  containerLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textLarge: {
    fontSize: 14,
  },
});
