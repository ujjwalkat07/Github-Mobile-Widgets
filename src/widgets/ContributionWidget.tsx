import React from 'react';
import { FlexWidget, TextWidget, SvgWidget } from 'react-native-android-widget';
import { ContributionData, GitHubUser, WidgetTheme } from '../types';
import { generateHeatmapSvg } from '../api';

interface Props {
  user: GitHubUser;
  contributions: ContributionData;
  theme: WidgetTheme;
  width?: number;
  height?: number;
}

export function ContributionWidget({
  user,
  contributions,
  theme,
  width = 320,
}: Props) {
  const currentYear = new Date().getFullYear();
  const yearTotal =
    contributions.total?.[currentYear.toString()] ||
    contributions.total?.lastYear ||
    contributions.contributions.reduce((acc, c) => acc + c.count, 0);

  const heatmapWidth = Math.max(260, width - 36);
  const svgString = generateHeatmapSvg({
    contributions: contributions.contributions,
    levelColors: theme.levels,
    columns: 20,
    width: heatmapWidth,
  });

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: theme.cardBackground,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: theme.borderColor,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginBottom: 6,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text={`@${user.login}`}
            style={{
              color: theme.textPrimary,
              fontSize: 14,
              fontWeight: 'bold',
            }}
          />
          {contributions.committedToday && (
            <FlexWidget
              style={{
                backgroundColor: theme.levels[3],
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: 6,
              }}
            >
              <TextWidget
                text="Active"
                style={{
                  color: '#ffffff',
                  fontSize: 9,
                  fontWeight: 'bold',
                }}
              />
            </FlexWidget>
          )}
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text={`🔥 ${contributions.currentStreak}d`}
            style={{
              color: theme.accent,
              fontSize: 13,
              fontWeight: 'bold',
              marginRight: 6,
            }}
          />
          <TextWidget
            text={`${yearTotal.toLocaleString()} in ${currentYear}`}
            style={{
              color: theme.textSecondary,
              fontSize: 12,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* SVG Heatmap Matrix */}
      <FlexWidget
        style={{
          width: 'match_parent',
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 4,
        }}
      >
        <SvgWidget
          svg={svgString}
          style={{
            width: heatmapWidth,
            height: 70,
          }}
        />
      </FlexWidget>

      {/* Footer / Legend */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginTop: 6,
        }}
      >
        <TextWidget
          text="GitGlance"
          style={{
            color: theme.textSecondary,
            fontSize: 10,
          }}
        />

        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="Less "
            style={{
              color: theme.textSecondary,
              fontSize: 9,
            }}
          />
          {theme.levels.map((lvlColor, idx) => (
            <FlexWidget
              key={idx}
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                backgroundColor: lvlColor,
                marginHorizontal: 1.5,
              }}
            />
          ))}
          <TextWidget
            text=" More"
            style={{
              color: theme.textSecondary,
              fontSize: 9,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
