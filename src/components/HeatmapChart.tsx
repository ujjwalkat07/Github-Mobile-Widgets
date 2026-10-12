import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ContributionData, ContributionDay, WidgetTheme } from '../types';
import { getContributionWeeks } from '../api';

interface Props {
  contributions: ContributionData;
  theme: WidgetTheme;
}

function computeMonthLabels(weeks: (ContributionDay | undefined)[][]): (string | null)[] {
  let lastMonth = '';
  const labels: (string | null)[] = [];
  for (const week of weeks) {
    const validDay = week.find((d) => d && d.date);
    if (!validDay || !validDay.date) {
      labels.push(null);
      continue;
    }
    const parts = validDay.date.split('-');
    if (parts.length < 2) {
      labels.push(null);
      continue;
    }
    const dateObj = new Date(
      Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2] || '1', 10))
    );
    const m = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    if (m !== lastMonth) {
      lastMonth = m;
      labels.push(m);
    } else {
      labels.push(null);
    }
  }
  return labels;
}

export function HeatmapChart({ contributions, theme }: Props) {
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [scrollRatio, setScrollRatio] = useState<number>(1);
  const chartScrollRef = useRef<ScrollView>(null);

  const weeks = useMemo(() => {
    return getContributionWeeks(contributions.contributions);
  }, [contributions.contributions]);

  // Calculate month labels above weeks
  const monthLabels = useMemo(() => computeMonthLabels(weeks), [weeks]);

  const handleCellPress = (day: ContributionDay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(day);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    if (maxScroll > 0) {
      const ratio = Math.max(0, Math.min(1, contentOffset.x / maxScroll));
      setScrollRatio(ratio);
    }
  };

  return (
    <View style={styles.container}>
      {/* Selected Day Inspector */}
      <View
        style={[
          styles.inspectorBanner,
          {
            backgroundColor: theme.background,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {selectedDay ? (
          <View style={styles.inspectorContent}>
            <View>
              <Text style={[styles.inspectorDate, { color: theme.textPrimary }]}>
                {selectedDay.date
                  ? new Date(selectedDay.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Selected Day'}
              </Text>
              <Text style={[styles.inspectorCount, { color: theme.accent }]}>
                {selectedDay.count} {selectedDay.count === 1 ? 'contribution' : 'contributions'}
              </Text>
            </View>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: theme.levels[selectedDay.level] },
              ]}
            >
              <Text style={styles.levelBadgeText}>Level {selectedDay.level}</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.inspectorPlaceholder, { color: theme.textSecondary }]}>
            👆 Tap any square on the matrix to inspect daily commits
          </Text>
        )}
      </View>

      {/* 365-Day Scrollable Matrix */}
      <ScrollView
        ref={chartScrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        persistentScrollbar={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.gridScrollContent}
        onContentSizeChange={() => {
          chartScrollRef.current?.scrollToEnd({ animated: false });
          setScrollRatio(1);
        }}
      >
        <View style={styles.gridWrapper}>
          {/* Month Header Row */}
          <View style={styles.monthsRow}>
            {weeks.map((_, colIdx) => (
              <View key={colIdx} style={styles.monthHeaderCol}>
                {monthLabels[colIdx] ? (
                  <Text style={[styles.monthLabelText, { color: theme.textSecondary }]}>
                    {monthLabels[colIdx]}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* 7-Row Grid Columns */}
          <View style={styles.grid}>
            {weeks.map((week, colIdx) => (
              <View key={colIdx} style={styles.gridColumn}>
                {week.map((day, rowIdx) => {
                  if (!day || !day.date) {
                    return (
                      <View
                        key={rowIdx}
                        style={[styles.cell, { backgroundColor: 'transparent' }]}
                      />
                    );
                  }
                  const isSelected = selectedDay?.date === day.date;
                  return (
                    <TouchableOpacity
                      key={rowIdx}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: theme.levels[day.level],
                          borderColor: isSelected ? '#ffffff' : 'transparent',
                          borderWidth: isSelected ? 1.5 : 0,
                        },
                      ]}
                      onPress={() => handleCellPress(day)}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </View>
            ))}
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
        <View style={styles.scrollBarLegend}>
          <Text style={[styles.scrollLegendText, { color: theme.textSecondary }]}>
            ← 1 Year Ago (52 wks)
          </Text>
          <Text style={[styles.scrollLegendCenter, { color: theme.accent }]}>
            Full 365 Days • Scrollable
          </Text>
          <Text style={[styles.scrollLegendText, { color: theme.textSecondary }]}>
            Today →
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    gap: 10,
  },
  inspectorBanner: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  inspectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  inspectorCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  inspectorPlaceholder: {
    fontSize: 12,
    textAlign: 'center',
  },
  gridScrollContent: {
    paddingVertical: 4,
  },
  gridWrapper: {
    flexDirection: 'column',
  },
  monthsRow: {
    flexDirection: 'row',
    height: 18,
    marginBottom: 4,
  },
  monthHeaderCol: {
    width: 15.5,
    overflow: 'visible',
  },
  monthLabelText: {
    fontSize: 9,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: 3.5,
  },
  gridColumn: {
    flexDirection: 'column',
    gap: 3.5,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2.5,
  },
  scrollTrackWrapper: {
    marginTop: 4,
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
});
