import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GitHubUser, ContributionData, WidgetTheme, WidgetType } from '../types';
import { formatNumber, generateHeatmapSvg, getActiveDaysCount, getMonthHeaders } from '../api';
import { SvgXml } from 'react-native-svg';

const SIX_MONTHS_WEEKS = 26;
const CELL_SIZE = 10;
const CELL_GAP = 2.5;
const SIX_MONTHS_WIDTH = SIX_MONTHS_WEEKS * CELL_SIZE + (SIX_MONTHS_WEEKS - 1) * CELL_GAP; // ~323px
const SIX_MONTHS_HEIGHT = 7 * CELL_SIZE + 6 * CELL_GAP; // 85px

interface Props {
  widgetType: WidgetType;
  user: GitHubUser;
  contributions: ContributionData;
  theme: WidgetTheme;
  onPinWidget: () => void;
  onOpenGuide: () => void;
}

export function WidgetPreview({
  widgetType,
  user,
  contributions,
  theme,
  onPinWidget,
  onOpenGuide,
}: Props) {
  const previewScrollRef = useRef<ScrollView>(null);
  const [scrollRatio, setScrollRatio] = useState<number>(1);

  const handlePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPinWidget();
  };

  const handlePreviewScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    if (maxScroll > 0) {
      const ratio = Math.max(0, Math.min(1, contentOffset.x / maxScroll));
      setScrollRatio(ratio);
    }
  };

  const renderWidgetContent = () => {
    const currentYear = new Date().getFullYear();
    const yearTotal =
      contributions.total?.[currentYear.toString()] ||
      contributions.total?.lastYear ||
      contributions.contributions.reduce((acc, c) => acc + c.count, 0);

    const activeDays = getActiveDaysCount(contributions.contributions);
    const rawBio = (user.bio || [user.company, user.location].filter(Boolean).join(' • ') || '')
      .replace(/[\r\n]+/g, ' ')
      .trim();
    const bioText = rawBio ? (rawBio.startsWith('💻') ? rawBio : `💻 ${rawBio}`) : '';

    // Profile Card Preview (Image 2)
    if (widgetType === 'ProfileCard') {
      return (
        <View
          style={[
            styles.masterCard,
            styles.profileCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
            },
          ]}
        >
          {/* 1. Header: Name + Username side by side */}
          <View style={styles.masterHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.masterName, { color: theme.textPrimary }]} numberOfLines={1}>
                {user.name || user.login}
              </Text>
              <Text style={[styles.masterUsername, { color: theme.textSecondary }]} numberOfLines={1}>
                @{user.login}
              </Text>
            </View>
            {bioText ? (
              <Text style={[styles.masterSubline, { color: theme.textSecondary }]} numberOfLines={1}>
                {bioText}
              </Text>
            ) : null}
          </View>

          {/* 2. Stats in ONE row with reduced font size */}
          <View style={styles.masterStatsRow}>
            <View style={styles.masterStatCol}>
              <Text style={[styles.profileBigStatNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatNumber(yearTotal)}
              </Text>
              <Text style={[styles.profileBigStatLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                Contributions (1y)
              </Text>
            </View>

            <View style={styles.masterStatCol}>
              <Text style={[styles.profileBigStatNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatNumber(user.public_repos)}
              </Text>
              <Text style={[styles.profileBigStatLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                Public repos
              </Text>
            </View>

            <View style={styles.masterStatCol}>
              <Text style={[styles.profileBigStatNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatNumber(activeDays)}
              </Text>
              <Text style={[styles.profileBigStatLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                Active days
              </Text>
            </View>

            <View style={styles.masterStatCol}>
              <Text style={[styles.profileBigStatNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatNumber(user.followers)}
              </Text>
              <Text style={[styles.profileBigStatLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                Followers
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Heatmap Card Preview (Last 6 Months)
    const columns = SIX_MONTHS_WEEKS; // 26 weeks
    const svgContent = generateHeatmapSvg({
      contributions: contributions.contributions,
      levelColors: theme.levels,
      columns,
      cellSize: CELL_SIZE,
      cellGap: CELL_GAP,
      width: SIX_MONTHS_WIDTH,
    });

    const monthHeaders = getMonthHeaders(contributions.contributions, columns);
    const monthMap: Record<number, string> = {};
    monthHeaders.forEach((m) => {
      monthMap[m.col] = m.label;
    });
    const colsArray = Array.from({ length: columns }, (_, i) => i);

    return (
      <View
        style={[
          styles.masterCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {/* 1. Header: Name + Username side by side */}
        <View style={styles.masterHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.masterName, { color: theme.textPrimary }]} numberOfLines={1}>
              {user.name || user.login}
            </Text>
            <Text style={[styles.masterUsername, { color: theme.textSecondary }]} numberOfLines={1}>
              @{user.login}
            </Text>
          </View>
          {bioText ? (
            <Text style={[styles.masterSubline, { color: theme.textSecondary }]} numberOfLines={1}>
              {bioText}
            </Text>
          ) : null}
        </View>

        {/* 2. Full Heatmap with Months, Days, and Horizontal Scroll */}
        <View style={styles.masterHeatmapSection}>
          <ScrollView
            ref={previewScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handlePreviewScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.masterScrollContainer}
            onContentSizeChange={() => {
              previewScrollRef.current?.scrollToEnd({ animated: false });
              setScrollRatio(1);
            }}
          >
            <View style={{ flexDirection: 'column' }}>
              {/* Month Header Row */}
              <View style={[styles.masterMonthRow, { marginLeft: 22 }]}>
                {colsArray.map((colIdx) => (
                  <View
                    key={colIdx}
                    style={{
                      width: CELL_SIZE + CELL_GAP,
                    }}
                  >
                    {monthMap[colIdx] ? (
                      <Text style={[styles.masterMonthText, { color: theme.textSecondary }]}>
                        {monthMap[colIdx]}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>

              {/* Day Labels + Grid */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.masterDayCol}>
                  <Text style={[styles.masterDayText, { color: theme.textSecondary }]}>Mon</Text>
                  <Text style={[styles.masterDayText, { color: theme.textSecondary }]}>Wed</Text>
                  <Text style={[styles.masterDayText, { color: theme.textSecondary }]}>Fri</Text>
                </View>

                <SvgXml xml={svgContent} width={SIX_MONTHS_WIDTH} height={SIX_MONTHS_HEIGHT} />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Scroll Bar Track */}
          <View style={styles.scrollTrackWrapper}>
            <View
              style={[
                styles.scrollTrack,
                { backgroundColor: theme.background, borderColor: theme.borderColor },
              ]}
            >
              <View
                style={[
                  styles.scrollThumb,
                  {
                    backgroundColor: theme.accent,
                    left: `${scrollRatio * 75}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Actual Widget Display */}
      {renderWidgetContent()}

      {/* Add to Home Option */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.addToHomeButton, { backgroundColor: '#ffffff' }]}
          onPress={handlePin}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#09090b" />
          <Text style={styles.addToHomeButtonText}>Add to Home Screen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.guideButton, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}
          onPress={onOpenGuide}
          activeOpacity={0.8}
        >
          <Ionicons name="help-circle-outline" size={17} color={theme.textSecondary} />
          <Text style={[styles.guideButtonText, { color: theme.textSecondary }]}>Guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addToHomeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  addToHomeButtonText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '700',
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  guideButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  masterCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  profileCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  masterHeader: {
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masterName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  masterUsername: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  masterSubline: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  masterHeatmapSection: {
    marginVertical: 2,
  },
  masterScrollContainer: {
    paddingVertical: 4,
  },
  masterMonthRow: {
    flexDirection: 'row',
    height: 14,
    marginBottom: 3,
  },
  masterMonthText: {
    fontSize: 8,
    fontWeight: '700',
  },
  masterDayCol: {
    width: 22,
    height: SIX_MONTHS_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  masterDayText: {
    fontSize: 8,
    fontWeight: '600',
  },
  scrollTrackWrapper: {
    marginTop: 6,
    marginBottom: 2,
    gap: 4,
  },
  scrollTrack: {
    height: 4,
    borderRadius: 2,
    borderWidth: 0.5,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  scrollThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '25%',
    borderRadius: 2,
  },
  masterStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 2,
  },
  masterStatCol: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  profileBigStatNumber: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileBigStatLabel: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '500',
  },
});
