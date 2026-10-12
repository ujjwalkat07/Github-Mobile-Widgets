import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';
import { ContributionData, GitHubUser, WidgetTheme } from '../types';
import { formatNumber } from '../api';

interface Props {
  user: GitHubUser;
  contributions: ContributionData;
  theme: WidgetTheme;
}

export function ProfileWidget({ user, contributions, theme }: Props) {
  const avatarUrl = (user.avatar_url || 'https://avatars.githubusercontent.com/u/9919?v=4') as `https://${string}`;
  const currentYear = new Date().getFullYear();
  const yearTotal =
    contributions.total?.[currentYear.toString()] ||
    contributions.total?.lastYear ||
    contributions.contributions.reduce((acc, c) => acc + c.count, 0);

  const metaText = [user.company ? `🏢 ${user.company}` : '', user.location ? `📍 ${user.location}` : '']
    .filter(Boolean)
    .join('  •  ');

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
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header: Avatar + Identity */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: 4,
        }}
      >
        <ImageWidget
          image={avatarUrl}
          imageWidth={42}
          imageHeight={42}
          radius={21}
          style={{ marginRight: 10 }}
        />
        <FlexWidget
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget
              text={user.name || user.login}
              style={{
                color: theme.textPrimary,
                fontSize: 14,
                fontWeight: 'bold',
              }}
            />
          </FlexWidget>
          <TextWidget
            text={`@${user.login}`}
            style={{
              color: theme.accent,
              fontSize: 11,
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Bio / Meta snippet */}
      {user.bio ? (
        <FlexWidget style={{ width: 'match_parent', marginVertical: 2 }}>
          <TextWidget
            text={user.bio}
            maxLines={2}
            truncate="END"
            style={{
              color: theme.textSecondary,
              fontSize: 10,
            }}
          />
        </FlexWidget>
      ) : null}

      {metaText ? (
        <FlexWidget style={{ width: 'match_parent', marginBottom: 2 }}>
          <TextWidget
            text={metaText}
            maxLines={1}
            truncate="END"
            style={{
              color: theme.textSecondary,
              fontSize: 9,
            }}
          />
        </FlexWidget>
      ) : null}

      {/* Complete Stats Grid */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          marginVertical: 4,
        }}
      >
        {/* Row 1: Repos & Followers */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <FlexWidget
            style={{
              flex: 1,
              backgroundColor: theme.background,
              borderRadius: 8,
              paddingVertical: 5,
              paddingHorizontal: 8,
              marginRight: 3,
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={formatNumber(user.public_repos)}
              style={{
                color: theme.textPrimary,
                fontSize: 13,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Repos"
              style={{
                color: theme.textSecondary,
                fontSize: 9,
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flex: 1,
              backgroundColor: theme.background,
              borderRadius: 8,
              paddingVertical: 5,
              paddingHorizontal: 8,
              marginLeft: 3,
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={formatNumber(user.followers)}
              style={{
                color: theme.textPrimary,
                fontSize: 13,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Followers"
              style={{
                color: theme.textSecondary,
                fontSize: 9,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Row 2: Streak & Year Commits */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <FlexWidget
            style={{
              flex: 1,
              backgroundColor: theme.background,
              borderRadius: 8,
              paddingVertical: 5,
              paddingHorizontal: 8,
              marginRight: 3,
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={`🔥 ${contributions.currentStreak}d`}
              style={{
                color: theme.accent,
                fontSize: 13,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Streak"
              style={{
                color: theme.textSecondary,
                fontSize: 9,
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flex: 1,
              backgroundColor: theme.background,
              borderRadius: 8,
              paddingVertical: 5,
              paddingHorizontal: 8,
              marginLeft: 3,
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={formatNumber(yearTotal)}
              style={{
                color: theme.levels[3],
                fontSize: 13,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text={`${currentYear} Commits`}
              style={{
                color: theme.textSecondary,
                fontSize: 9,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Footer Pill Status */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <FlexWidget
          style={{
            backgroundColor: contributions.committedToday ? theme.levels[3] : '#27272a',
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <TextWidget
            text={contributions.committedToday ? 'Active Today ✨' : 'Need Commit ⚡'}
            style={{
              color: '#ffffff',
              fontSize: 9,
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>

        <TextWidget
          text={`Best: ${contributions.longestStreak}d`}
          style={{
            color: theme.textSecondary,
            fontSize: 9,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
