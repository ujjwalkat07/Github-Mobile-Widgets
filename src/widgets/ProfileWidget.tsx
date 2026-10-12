import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ContributionData, GitHubUser, WidgetTheme } from '../types';
import { formatNumber, getActiveDaysCount } from '../api';

interface Props {
  user: GitHubUser;
  contributions: ContributionData;
  theme: WidgetTheme;
  width?: number;
  height?: number;
}

export function ProfileWidget({
  user,
  contributions,
  theme,
  width = 340,
  height = 90,
}: Props) {
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

  // Sizing calculations based on container dimensions
  const w = width || 340;
  const h = height || 90;

  const isNarrow = w < 240;
  const cardPadding = Math.min(14, Math.max(8, Math.floor(h * 0.09)));
  const nameFontSize = Math.min(18, Math.max(13, Math.floor(h * 0.15)));
  const sublineFontSize = Math.min(10.5, Math.max(8, Math.floor(h * 0.08)));

  // Reduced stats font sizes
  const statNumFontSize = Math.min(18, Math.max(13, Math.floor(h * 0.16)));
  const statLblFontSize = Math.min(9.5, Math.max(7.5, Math.floor(h * 0.075)));
  const headerMarginBottom = Math.min(8, Math.max(3, Math.floor(h * 0.06)));

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.borderColor,
        padding: cardPadding,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* 1. Header: Name & Username side by side */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          marginBottom: headerMarginBottom,
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

      {/* 2. Stats Section */}
      {isNarrow ? (
        // 2x2 Grid for narrow widget layout
        <FlexWidget
          style={{
            flexDirection: 'column',
            width: 'match_parent',
            marginTop: 2,
          }}
        >
          <FlexWidget
            style={{
              flexDirection: 'row',
              width: 'match_parent',
              marginBottom: 8,
            }}
          >
            <FlexWidget
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <TextWidget
                text={formatNumber(yearTotal)}
                maxLines={1}
                style={{
                  color: theme.textPrimary,
                  fontSize: statNumFontSize,
                  fontWeight: 'bold',
                }}
              />
              <TextWidget
                text="Contributions (1y)"
                maxLines={1}
                style={{
                  color: theme.textSecondary,
                  fontSize: statLblFontSize,
                  marginTop: 2,
                }}
              />
            </FlexWidget>

            <FlexWidget
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <TextWidget
                text={formatNumber(user.public_repos)}
                maxLines={1}
                style={{
                  color: theme.textPrimary,
                  fontSize: statNumFontSize,
                  fontWeight: 'bold',
                }}
              />
              <TextWidget
                text="Public repos"
                maxLines={1}
                style={{
                  color: theme.textSecondary,
                  fontSize: statLblFontSize,
                  marginTop: 2,
                }}
              />
            </FlexWidget>
          </FlexWidget>

          <FlexWidget
            style={{
              flexDirection: 'row',
              width: 'match_parent',
            }}
          >
            <FlexWidget
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <TextWidget
                text={formatNumber(activeDays)}
                maxLines={1}
                style={{
                  color: theme.textPrimary,
                  fontSize: statNumFontSize,
                  fontWeight: 'bold',
                }}
              />
              <TextWidget
                text="Active days"
                maxLines={1}
                style={{
                  color: theme.textSecondary,
                  fontSize: statLblFontSize,
                  marginTop: 2,
                }}
              />
            </FlexWidget>

            <FlexWidget
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <TextWidget
                text={formatNumber(user.followers)}
                maxLines={1}
                style={{
                  color: theme.textPrimary,
                  fontSize: statNumFontSize,
                  fontWeight: 'bold',
                }}
              />
              <TextWidget
                text="Followers"
                maxLines={1}
                style={{
                  color: theme.textSecondary,
                  fontSize: statLblFontSize,
                  marginTop: 2,
                }}
              />
            </FlexWidget>
          </FlexWidget>
        </FlexWidget>
      ) : (
        // Standard / Wide: 4 Columns in 1 Row
        <FlexWidget
          style={{
            flexDirection: 'row',
            width: 'match_parent',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: 2,
          }}
        >
          {/* Contributions (1y) */}
          <FlexWidget
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <TextWidget
              text={formatNumber(yearTotal)}
              maxLines={1}
              style={{
                color: theme.textPrimary,
                fontSize: statNumFontSize,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Contributions (1y)"
              maxLines={1}
              style={{
                color: theme.textSecondary,
                fontSize: statLblFontSize,
                marginTop: 2,
              }}
            />
          </FlexWidget>

          {/* Public repos */}
          <FlexWidget
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <TextWidget
              text={formatNumber(user.public_repos)}
              maxLines={1}
              style={{
                color: theme.textPrimary,
                fontSize: statNumFontSize,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Public repos"
              maxLines={1}
              style={{
                color: theme.textSecondary,
                fontSize: statLblFontSize,
                marginTop: 2,
              }}
            />
          </FlexWidget>

          {/* Active days */}
          <FlexWidget
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <TextWidget
              text={formatNumber(activeDays)}
              maxLines={1}
              style={{
                color: theme.textPrimary,
                fontSize: statNumFontSize,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Active days"
              maxLines={1}
              style={{
                color: theme.textSecondary,
                fontSize: statLblFontSize,
                marginTop: 2,
              }}
            />
          </FlexWidget>

          {/* Followers */}
          <FlexWidget
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <TextWidget
              text={formatNumber(user.followers)}
              maxLines={1}
              style={{
                color: theme.textPrimary,
                fontSize: statNumFontSize,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Followers"
              maxLines={1}
              style={{
                color: theme.textSecondary,
                fontSize: statLblFontSize,
                marginTop: 2,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
