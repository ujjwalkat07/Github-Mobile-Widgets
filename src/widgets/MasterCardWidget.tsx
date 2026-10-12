import React from 'react';
import { FlexWidget, TextWidget, SvgWidget } from 'react-native-android-widget';
import { ContributionData, GitHubUser, WidgetTheme } from '../types';
import { getMonthHeaders, generateHeatmapSvg } from '../api';

interface Props {
  user: GitHubUser;
  contributions: ContributionData;
  theme: WidgetTheme;
  width?: number;
  height?: number;
}

export function MasterCardWidget({
  user,
  contributions,
  theme,
  width = 340,
  height = 180,
}: Props) {
  const rawBio = (user.bio || [user.company, user.location].filter(Boolean).join(' • ') || '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const bioText = rawBio ? (rawBio.startsWith('💻') ? rawBio : `💻 ${rawBio}`) : '';

  // Responsive calculations based on container dimensions
  const widgetWidth = width || 340;
  const widgetHeight = height || 180;

  // Responsive padding and typography
  const cardPadding = Math.min(18, Math.max(10, Math.floor(widgetWidth * 0.038)));
  const nameFontSize = Math.min(22, Math.max(15, Math.floor(widgetHeight * 0.11)));
  const sublineFontSize = Math.min(12, Math.max(9, Math.floor(widgetHeight * 0.055)));

  // Determine vertical space available for the heatmap
  const headerHeightApprox = nameFontSize + (bioText ? sublineFontSize + 4 : 0) + 10;
  const monthLabelHeight = 12;
  const dayLabelWidth = 22;

  const availGridHeight = Math.max(48, widgetHeight - cardPadding * 2 - headerHeightApprox - monthLabelHeight);
  const availGridWidth = Math.max(160, widgetWidth - cardPadding * 2 - dayLabelWidth);

  // Display last 6 months (26 weeks)
  const columns = 26;
  const cellGap = 2.5;

  // Compute cellSize adjusted for 26 columns
  const maxCellFromHeight = Math.floor((availGridHeight - 6 * cellGap) / 7);
  const maxCellFromWidth = Math.floor((availGridWidth - (columns - 1) * cellGap) / columns);
  const cellSize = Math.max(7, Math.min(14, Math.min(maxCellFromHeight, maxCellFromWidth)));

  const gridWidth = columns * cellSize + (columns - 1) * cellGap;
  const gridHeight = 7 * cellSize + 6 * cellGap;

  const svgString = generateHeatmapSvg({
    contributions: contributions.contributions,
    levelColors: theme.levels,
    columns,
    cellSize,
    cellGap,
    radius: 2,
    width: gridWidth,
  });

  const monthHeaders = getMonthHeaders(contributions.contributions, columns);

  // Group month headers into non-overlapping spans
  const renderedMonthSpans: { col: number; width: number; label: string }[] = [];
  for (let i = 0; i < monthHeaders.length; i++) {
    const cur = monthHeaders[i];
    const nextCol = i < monthHeaders.length - 1 ? monthHeaders[i + 1].col : columns;
    const spanCols = Math.max(1, nextCol - cur.col);
    const spanWidth = spanCols * (cellSize + cellGap);
    renderedMonthSpans.push({
      col: cur.col,
      width: spanWidth,
      label: cur.label,
    });
  }
  const leadingOffset = monthHeaders.length > 0 && monthHeaders[0].col > 0
    ? monthHeaders[0].col * (cellSize + cellGap)
    : 0;

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
        padding: cardPadding,
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      {/* 1. Header Section: Name + Username side-by-side */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          marginBottom: 8,
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: 'match_parent',
          }}
        >
          <TextWidget
            text={user.name || user.login}
            maxLines={1}
            truncate="END"
            style={{
              color: theme.textPrimary,
              fontSize: nameFontSize,
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text={`@${user.login}`}
            maxLines={1}
            truncate="END"
            style={{
              color: theme.textSecondary,
              fontSize: Math.max(10, nameFontSize - 4),
              marginLeft: 8,
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>

        {bioText ? (
          <TextWidget
            text={bioText}
            maxLines={1}
            truncate="END"
            style={{
              color: theme.textSecondary,
              fontSize: sublineFontSize,
              marginTop: 2,
            }}
          />
        ) : null}
      </FlexWidget>

      {/* 2. Full Heatmap Grid with Month & Day Labels */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          marginTop: 2,
        }}
      >
        {/* Month Labels Row */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            width: gridWidth + dayLabelWidth,
            height: monthLabelHeight,
            marginBottom: 2,
          }}
        >
          <FlexWidget style={{ width: dayLabelWidth + leadingOffset }} />
          {renderedMonthSpans.map((span, idx) => (
            <FlexWidget
              key={idx}
              style={{
                width: span.width,
              }}
            >
              <TextWidget
                text={span.label}
                maxLines={1}
                style={{
                  color: theme.textSecondary,
                  fontSize: Math.min(8.5, Math.max(7, cellSize * 0.8)),
                  fontWeight: 'bold',
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>

        {/* Days Column + SVG Matrix */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Day-of-week labels on the left aligned to rows */}
          <FlexWidget
            style={{
              flexDirection: 'column',
              width: dayLabelWidth,
              height: gridHeight,
              justifyContent: 'space-between',
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((rowIdx) => (
              <FlexWidget
                key={rowIdx}
                style={{
                  height: cellSize,
                  marginBottom: rowIdx < 6 ? cellGap : 0,
                  justifyContent: 'center',
                }}
              >
                {rowIdx === 1 ? (
                  <TextWidget
                    text="Mon"
                    style={{
                      color: theme.textSecondary,
                      fontSize: Math.min(8.5, Math.max(7, cellSize * 0.8)),
                    }}
                  />
                ) : rowIdx === 3 ? (
                  <TextWidget
                    text="Wed"
                    style={{
                      color: theme.textSecondary,
                      fontSize: Math.min(8.5, Math.max(7, cellSize * 0.8)),
                    }}
                  />
                ) : rowIdx === 5 ? (
                  <TextWidget
                    text="Fri"
                    style={{
                      color: theme.textSecondary,
                      fontSize: Math.min(8.5, Math.max(7, cellSize * 0.8)),
                    }}
                  />
                ) : null}
              </FlexWidget>
            ))}
          </FlexWidget>

          {/* Heatmap Matrix SVG */}
          <SvgWidget
            svg={svgString}
            style={{
              width: gridWidth,
              height: gridHeight,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
