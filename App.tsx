import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { GitHubUser, ContributionData, WidgetType, WidgetThemeId, WidgetTheme } from './src/types';
import { getTheme } from './src/themes';
import { GitHubApi, formatNumber } from './src/api';
import { AppStorage } from './src/storage';
import { WidgetService } from './src/widgets/widgetService';

import { Header } from './src/components/Header';
import { WidgetPreview } from './src/components/WidgetPreview';
import { HeatmapChart } from './src/components/HeatmapChart';
import { ThemePicker } from './src/components/ThemePicker';

export default function App() {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [activeUsername, setActiveUsername] = useState<string>('torvalds');
  const [themeId, setThemeId] = useState<WidgetThemeId>('classic');
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>('ContributionGraph');

  const [user, setUser] = useState<GitHubUser | null>(null);
  const [contributions, setContributions] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [guideVisible, setGuideVisible] = useState<boolean>(false);

  const activeTheme: WidgetTheme = getTheme(themeId);

  // Fetch live GitHub data directly from API
  const fetchLiveGitHubData = useCallback(async (targetUsername: string) => {
    const clean = targetUsername.trim().toLowerCase();
    if (!clean) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const data = await GitHubApi.fetchRecord(clean);
      setUser(data.user);
      setContributions(data.contributions);
      setActiveUsername(clean);
      setUsernameInput(clean);
      await AppStorage.setUsername(clean);
      await AppStorage.cacheData(clean, data);

      // Trigger background update if native widgets supported
      WidgetService.updateAll().catch(() => { });
    } catch (err: any) {
      setErrorMessage(err?.message || `Could not fetch GitHub data for "${clean}". Check username.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const savedUser = await AppStorage.getUsername();
      const savedTheme = await AppStorage.getThemeId();
      setActiveUsername(savedUser);
      setUsernameInput(savedUser);
      setThemeId(savedTheme);

      // Check cache first for instant render
      const cached = await AppStorage.getCachedData(savedUser);
      if (cached) {
        setUser(cached.user);
        setContributions(cached.contributions);
      }

      await fetchLiveGitHubData(savedUser);
    })();
  }, [fetchLiveGitHubData]);

  // Handle Fetch Button Press
  const handleFetchPress = () => {
    if (!usernameInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchLiveGitHubData(usernameInput);
  };

  // Handle Theme Selection
  const handleSelectTheme = async (newThemeId: WidgetThemeId) => {
    setThemeId(newThemeId);
    await AppStorage.setThemeId(newThemeId);
    WidgetService.updateAll().catch(() => { });
  };

  // Handle Pin Widget
  const handlePin = async () => {
    const result = await WidgetService.pin(selectedWidget);
    if (result.success) {
      Alert.alert('🎉 Widget Pinned', result.message);
    } else {
      Alert.alert('Widget Instructions', result.message, [
        { text: 'View Guide', onPress: () => setGuideVisible(true) },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearTotal = contributions
    ? contributions.total?.[currentYear.toString()] ||
    contributions.total?.lastYear ||
    contributions.contributions.reduce((acc, c) => acc + c.count, 0)
    : 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: activeTheme.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style="light" />

        {/* Minimal Header */}
        <Header
          theme={activeTheme}
          loading={loading}
          onRefresh={() => fetchLiveGitHubData(activeUsername)}
          onOpenGuide={() => setGuideVisible(true)}
        />

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Username Input Card */}
          <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.borderColor }]}>
            <Text style={[styles.cardTitle, { color: activeTheme.textPrimary }]}>
              Enter GitHub Username
            </Text>
            <Text style={[styles.cardDescription, { color: activeTheme.textSecondary }]}>
              Fetch live contributions and profile stats directly from the GitHub API.
            </Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputBox, { borderColor: activeTheme.borderColor, backgroundColor: activeTheme.background }]}>
                <Text style={[styles.atPrefix, { color: activeTheme.textSecondary }]}>@</Text>
                <TextInput
                  style={[styles.textInput, { color: activeTheme.textPrimary }]}
                  placeholder="e.g. torvalds, shadcn, or your username"
                  placeholderTextColor={activeTheme.textSecondary}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  onSubmitEditing={handleFetchPress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>

              <TouchableOpacity
                style={[styles.fetchBtn, { backgroundColor: '#ffffff' }]}
                onPress={handleFetchPress}
                disabled={loading || !usernameInput.trim()}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#09090b" />
                ) : (
                  <Text style={styles.fetchBtnText}>Fetch</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions */}
            <View style={styles.quickChipsRow}>
              <Text style={[styles.quickChipsLabel, { color: activeTheme.textSecondary }]}>
                Try:
              </Text>
              {['torvalds', 'shadcn', 'gaearon', 'sindresorhus'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.quickChip,
                    {
                      borderColor: u === activeUsername ? activeTheme.accent : activeTheme.borderColor,
                      backgroundColor: u === activeUsername ? activeTheme.borderColor : 'transparent',
                    },
                  ]}
                  onPress={() => fetchLiveGitHubData(u)}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: u === activeUsername ? activeTheme.textPrimary : activeTheme.textSecondary },
                    ]}
                  >
                    @{u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>

          {/* User Profile Card */}
          {user && (
            <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.borderColor }]}>
              <View style={styles.profileHeader}>
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                <View style={styles.profileHeaderInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: activeTheme.textPrimary }]}>
                      {user.name || user.login}
                    </Text>
                    <Ionicons name="checkmark-circle" size={14} color={activeTheme.accent} style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={[styles.userLogin, { color: activeTheme.textSecondary }]}>
                    @{user.login}
                  </Text>
                  {user.bio ? (
                    <Text
                      style={[styles.userBio, { color: activeTheme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {user.bio}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Stats Strip */}
              <View style={[styles.statsStrip, { borderColor: activeTheme.borderColor }]}>
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: activeTheme.textPrimary }]}>
                    {formatNumber(user.public_repos)}
                  </Text>
                  <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                    Repositories
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: activeTheme.borderColor }]} />

                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: activeTheme.textPrimary }]}>
                    {formatNumber(user.followers)}
                  </Text>
                  <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                    Followers
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: activeTheme.borderColor }]} />

                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: activeTheme.accent }]}>
                    🔥 {contributions ? contributions.currentStreak : 0}d
                  </Text>
                  <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                    Streak
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: activeTheme.borderColor }]} />

                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: activeTheme.textPrimary }]}>
                    {formatNumber(yearTotal)}
                  </Text>
                  <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                    {currentYear} Commits
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Android Widget Section */}
          {user && contributions && (
            <View style={styles.widgetSection}>
              {/* Segmented Switcher */}
              <View
                style={[
                  styles.segmentedControl,
                  { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.borderColor },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    selectedWidget === 'ContributionGraph' && {
                      backgroundColor: activeTheme.background,
                      borderColor: activeTheme.borderColor,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedWidget('ContributionGraph');
                  }}
                >
                  <Ionicons
                    name="grid-outline"
                    size={14}
                    color={selectedWidget === 'ContributionGraph' ? activeTheme.accent : activeTheme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: selectedWidget === 'ContributionGraph' ? activeTheme.textPrimary : activeTheme.textSecondary,
                        fontWeight: selectedWidget === 'ContributionGraph' ? '700' : '500',
                      },
                    ]}
                  >
                    Heatmap Card
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    selectedWidget === 'ProfileCard' && {
                      backgroundColor: activeTheme.background,
                      borderColor: activeTheme.borderColor,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedWidget('ProfileCard');
                  }}
                >
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={selectedWidget === 'ProfileCard' ? activeTheme.accent : activeTheme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: selectedWidget === 'ProfileCard' ? activeTheme.textPrimary : activeTheme.textSecondary,
                        fontWeight: selectedWidget === 'ProfileCard' ? '700' : '500',
                      },
                    ]}
                  >
                    Profile Stats
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Actual Widget Display & Add to Home Option */}
              <WidgetPreview
                widgetType={selectedWidget}
                user={user}
                contributions={contributions}
                theme={activeTheme}
                onPinWidget={handlePin}
                onOpenGuide={() => setGuideVisible(true)}
              />

              {/* Theme Picker */}
              <ThemePicker
                selectedThemeId={themeId}
                onSelectTheme={handleSelectTheme}
                activeTheme={activeTheme}
              />
            </View>
          )}

          {/* 365-Day Contribution Matrix */}
          {contributions && (
            <View style={[styles.card, { backgroundColor: activeTheme.cardBackground, borderColor: activeTheme.borderColor }]}>
              <Text style={[styles.cardTitle, { color: activeTheme.textPrimary }]}>
                365-Day Contribution History
              </Text>
              <Text style={[styles.cardDescription, { color: activeTheme.textSecondary }]}>
                Live matrix of all commits in the past year. Tap any square to inspect.
              </Text>

              <HeatmapChart contributions={contributions} theme={activeTheme} />
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  atPrefix: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  fetchBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '700',
  },
  quickChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  quickChipsLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  profileHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userLogin: {
    fontSize: 12,
  },
  userBio: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 14,
  },
  statCell: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
  },
  widgetSection: {
    gap: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 12,
  },
});
