import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GitHubUser, ContributionData, WidgetTheme, WidgetType } from '../types';
import { formatNumber, generateHeatmapSvg } from '../api';
import { SvgXml } from 'react-native-svg';

const FULL_YEAR_WEEKS = 53;
const CELL_SIZE = 11;
const CELL_GAP = 3;
const FULL_YEAR_WIDTH = FULL_YEAR_WEEKS * CELL_SIZE + (FULL_YEAR_WEEKS - 1) * CELL_GAP; // ~739px
const FULL_YEAR_HEIGHT = 7 * CELL_SIZE + 6 * CELL_GAP; // 95px

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
    if (widgetType === 'ContributionGraph') {
      const currentYear = new Date().getFullYear();
      const yearTotal =
        contributions.total?.[currentYear.toString()] ||
        contributions.total?.lastYear ||
        contributions.contributions.reduce((a, b) => a + b.count, 0);

      // 53 weeks = full 365-day year length
      const svgContent = generateHeatmapSvg({
        contributions: contributions.contributions,
        levelColors: theme.levels,
        columns: FULL_YEAR_WEEKS,
        cellSize: CELL_SIZE,
        cellGap: CELL_GAP,
      });

      return (
        <View
          style={[
            styles.widgetCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.widgetHeader}>
            <View style={styles.headerLeft}>
              {user.avatar_url && (
                <Image source={{ uri: user.avatar_url }} style={styles.miniAvatar} />
              )}
              <Text style={[styles.widgetUserHandle, { color: theme.textPrimary }]}>
                @{user.login}
              </Text>
              {contributions.committedToday && (
                <View style={[styles.activeTag, { backgroundColor: theme.levels[3] }]}>
                  <Text style={styles.activeTagText}>Active</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              <Text style={[styles.streakPill, { color: theme.accent }]}>
                🔥 {contributions.currentStreak}d
              </Text>
              <Text style={[styles.statMuted, { color: theme.textSecondary }]}>
                {yearTotal.toLocaleString()} in {currentYear}
              </Text>
            </View>
          </View>

          {/* Full Year Heatmap Matrix with Bottom Scroll Bar */}
          <View style={styles.heatmapBox}>
            <ScrollView
              ref={previewScrollRef}
              horizontal
              showsHorizontalScrollIndicator={true}
              persistentScrollbar={true}
              onScroll={handlePreviewScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.heatmapScrollContainer}
              onContentSizeChange={() => {
                previewScrollRef.current?.scrollToEnd({ animated: false });
                setScrollRatio(1);
              }}
            >
              <SvgXml xml={svgContent} width={FULL_YEAR_WIDTH} height={FULL_YEAR_HEIGHT} />
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

          {/* Footer / Legend */}
          <View style={styles.widgetFooter}>
            <Text style={[styles.legendBrand, { color: theme.textSecondary }]}>
              GitGlance
            </Text>
            <View style={styles.legendRow}>
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Less </Text>
              {theme.levels.map((c, i) => (
                <View key={i} style={[styles.legendBox, { backgroundColor: c }]} />
              ))}
              <Text style={[styles.legendText, { color: theme.textSecondary }]}> More</Text>
            </View>
          </View>
        </View>
      );
    }

    // Complete Profile Card
    const currentYear = new Date().getFullYear();
    const yearTotal =
      contributions.total?.[currentYear.toString()] ||
      contributions.total?.lastYear ||
      contributions.contributions.reduce((acc, c) => acc + c.count, 0);

    const metaItems = [
      user.company ? `🏢 ${user.company}` : null,
      user.location ? `📍 ${user.location}` : null,
    ].filter(Boolean);

    return (
      <View
        style={[
          styles.widgetCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {/* Header: Avatar, Name, Handle */}
        <View style={styles.profileUserRow}>
          <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
          <View style={styles.profileInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                {user.name || user.login}
              </Text>
              <Ionicons name="checkmark-circle" size={13} color={theme.accent} />
            </View>
            <Text style={[styles.profileLogin, { color: theme.accent }]}>
              @{user.login}
            </Text>
          </View>
        </View>

        {/* Bio Snippet */}
        {user.bio ? (
          <Text
            style={[styles.profileBio, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {user.bio}
          </Text>
        ) : null}

        {/* Company & Location */}
        {metaItems.length > 0 ? (
          <Text style={[styles.profileMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {metaItems.join('  •  ')}
          </Text>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.profileStatsGrid}>
          <View style={[styles.profileStatTile, { backgroundColor: theme.background }]}>
            <Text style={[styles.statVal, { color: theme.textPrimary }]}>
              {formatNumber(user.public_repos)}
            </Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Repos</Text>
          </View>

          <View style={[styles.profileStatTile, { backgroundColor: theme.background }]}>
            <Text style={[styles.statVal, { color: theme.textPrimary }]}>
              {formatNumber(user.followers)}
            </Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Followers</Text>
          </View>

          <View style={[styles.profileStatTile, { backgroundColor: theme.background }]}>
            <Text style={[styles.statVal, { color: theme.accent }]}>
              🔥 {contributions.currentStreak}d
            </Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Streak</Text>
          </View>

          <View style={[styles.profileStatTile, { backgroundColor: theme.background }]}>
            <Text style={[styles.statVal, { color: theme.levels[3] }]}>
              {formatNumber(yearTotal)}
            </Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{currentYear} Commits</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.profileFooter}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: contributions.committedToday ? theme.levels[3] : '#27272a' },
            ]}
          >
            <Text style={styles.statusPillText}>
              {contributions.committedToday ? 'Active Today ✨' : 'Need Commit ⚡'}
            </Text>
          </View>
          <Text style={[styles.legendBrand, { color: theme.textSecondary }]}>
            Best: {contributions.longestStreak}d
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.previewFrame, { backgroundColor: '#09090b', borderColor: theme.borderColor }]}>
        <View style={styles.frameHeader}>
          <View style={styles.frameHeaderLeft}>
            <Ionicons name="phone-portrait-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.frameHeaderText, { color: theme.textSecondary }]}>
              Android Widget Preview ({widgetType === 'ContributionGraph' ? '4x2' : '2x2'})
            </Text>
          </View>
          <TouchableOpacity onPress={onOpenGuide} style={styles.guideBadge}>
            <Ionicons name="help-circle-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.guideBadgeText, { color: theme.textSecondary }]}>Guide</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.widgetWrapper}>{renderWidgetContent()}</View>
      </View>

      <TouchableOpacity
        style={[styles.pinButton, { backgroundColor: '#ffffff' }]}
        onPress={handlePin}
        activeOpacity={0.85}
      >
        <Ionicons name="pin" size={15} color="#09090b" />
        <Text style={styles.pinButtonText}>Pin to Android Home Screen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 12,
  },
  previewFrame: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  frameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  frameHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameHeaderText: {
    fontSize: 11,
    fontWeight: '500',
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  guideBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  widgetWrapper: {
    marginVertical: 2,
  },
  widgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  widgetUserHandle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    fontSize: 12,
    fontWeight: '700',
  },
  statMuted: {
    fontSize: 11,
  },
  heatmapBox: {
    marginVertical: 4,
  },
  heatmapScrollContainer: {
    paddingVertical: 4,
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
  scrollBarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  scrollLegendText: {
    fontSize: 9,
    fontWeight: '500',
  },
  scrollLegendCenter: {
    fontSize: 9,
    fontWeight: '700',
  },
  widgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  legendBrand: {
    fontSize: 10,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendText: {
    fontSize: 9,
  },
  legendBox: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  profileUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileLogin: {
    fontSize: 11,
  },
  profileStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  profileStatTile: {
    width: '48%',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLbl: {
    fontSize: 10,
    marginTop: 2,
  },
  profileBio: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 9,
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  profileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  pinButtonText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '700',
  },
});
