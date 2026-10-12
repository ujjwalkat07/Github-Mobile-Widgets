export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionData {
  total: {
    [year: string]: number;
    lastYear: number;
  };
  contributions: ContributionDay[];
  currentStreak: number;
  longestStreak: number;
  committedToday: boolean;
  todayCount: number;
}

export type WidgetType = 'ContributionGraph' | 'ProfileCard';

export type WidgetThemeId = 'classic' | 'cyberpunk' | 'emerald' | 'amoled';

export interface WidgetTheme {
  id: WidgetThemeId;
  name: string;
  badge: string;
  background: `#${string}`;
  cardBackground: `#${string}`;
  borderColor: `#${string}`;
  textPrimary: `#${string}`;
  textSecondary: `#${string}`;
  accent: `#${string}`;
  levels: [`#${string}`, `#${string}`, `#${string}`, `#${string}`, `#${string}`];
}
