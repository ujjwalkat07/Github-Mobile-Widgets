import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WidgetTheme } from '../types';

interface Props {
  theme: WidgetTheme;
  loading: boolean;
  onRefresh: () => void;
  onOpenGuide: () => void;
}

export function Header({
  theme,
  loading,
  onRefresh,
  onOpenGuide,
}: Props) {
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRefresh();
  };

  return (
    <View style={[styles.container, { borderBottomColor: theme.borderColor }]}>
      <View style={styles.brandRow}>
        <View style={[styles.logoBox, { borderColor: theme.borderColor }]}>
          <Ionicons name="logo-github" size={18} color={theme.textPrimary} />
        </View>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            GitGlance
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            GitHub Android Widgets
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, { borderColor: theme.borderColor }]}
          onPress={onOpenGuide}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={17} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { borderColor: theme.borderColor }]}
          onPress={handleRefresh}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.textPrimary} />
          ) : (
            <Ionicons name="sync-outline" size={17} color={theme.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: '#09090b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#18181b',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#18181b',
  },
});
