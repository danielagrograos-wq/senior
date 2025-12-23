import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function ShimmerPlaceholder({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function CaregiverCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ShimmerPlaceholder width={60} height={60} borderRadius={30} />
        <View style={styles.cardInfo}>
          <ShimmerPlaceholder width="60%" height={18} style={{ marginBottom: 8 }} />
          <ShimmerPlaceholder width="80%" height={14} style={{ marginBottom: 6 }} />
          <ShimmerPlaceholder width="40%" height={14} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ShimmerPlaceholder width={50} height={24} />
        </View>
      </View>
      <ShimmerPlaceholder width="100%" height={40} style={{ marginTop: 12 }} />
      <View style={styles.tagsRow}>
        <ShimmerPlaceholder width={80} height={24} borderRadius={12} />
        <ShimmerPlaceholder width={100} height={24} borderRadius={12} />
        <ShimmerPlaceholder width={70} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: colors.secondary[200],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
});
