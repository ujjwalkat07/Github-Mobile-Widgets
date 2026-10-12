import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WidgetTheme, WidgetThemeId } from '../types';
import { THEMES } from '../themes';

interface Props {
  selectedThemeId: WidgetThemeId;
  onSelectTheme: (id: WidgetThemeId) => void;
  activeTheme: WidgetTheme;
}

export function ThemePicker({
  selectedThemeId,
  onSelectTheme,
  activeTheme,
}: Props) {
  const themeList = Object.values(THEMES);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: activeTheme.textPrimary }]}>
        Theme Palette
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {themeList.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          return (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: isSelected ? theme.accent : theme.borderColor,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectTheme(theme.id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.badge, { color: theme.textSecondary }]}>
                  {theme.badge}
                </Text>
                {isSelected && (
                  <View style={[styles.checkDot, { backgroundColor: theme.accent }]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.name,
                  { color: theme.textPrimary, fontWeight: isSelected ? '700' : '600' },
                ]}
              >
                {theme.name}
              </Text>

              <View style={styles.swatchRow}>
                {theme.levels.map((lvlColor, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.swatch,
                      { backgroundColor: lvlColor, borderColor: theme.borderColor },
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  scrollContent: {
    gap: 10,
  },
  card: {
    width: 135,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#09090b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 12,
    marginBottom: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  swatch: {
    flex: 1,
    height: 12,
    borderRadius: 3,
    borderWidth: 0.5,
  },
});
