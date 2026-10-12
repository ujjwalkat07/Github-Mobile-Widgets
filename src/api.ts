import { GitHubUser, ContributionData, ContributionDay } from './types';

export function calculateStreaks(days: ContributionDay[]): {
  currentStreak: number;
  longestStreak: number;
  committedToday: boolean;
  todayCount: number;
} {
  if (!days || days.length === 0) {
    return { currentStreak: 0, longestStreak: 0, committedToday: false, todayCount: 0 };
  }

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const todayItem = sorted.find((d) => d.date === todayStr);
  const todayCount = todayItem ? todayItem.count : 0;
  const committedToday = todayCount > 0;

  let longest = 0;
  let tempStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].count > 0) {
      tempStreak++;
      if (tempStreak > longest) {
        longest = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  let currentStreak = 0;
  let started = false;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const item = sorted[i];
    const isToday = item.date === todayStr;
    const isYesterday = item.date === yesterdayStr;

    if (!started) {
      if (isToday) {
        if (item.count > 0) {
          started = true;
          currentStreak++;
        }
      } else if (isYesterday) {
        if (item.count > 0) {
          started = true;
          currentStreak++;
        } else {
          break;
        }
      } else if (item.count > 0) {
        started = true;
        currentStreak++;
      } else {
        break;
      }
    } else {
      if (item.count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    committedToday,
    todayCount,
  };
}

export function formatNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) {
    const val = (num / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${val}m`;
  }
  if (num >= 1000) {
    const val = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `${val}k`;
  }
  return num.toString();
}

export function getActiveDaysCount(contributions: ContributionDay[]): number {
  return (contributions || []).filter((d) => d && d.count > 0).length;
}

export function getSinceYear(createdAt?: string | null): number {
  if (!createdAt) return new Date().getFullYear();
  try {
    const y = new Date(createdAt).getFullYear();
    return isNaN(y) ? new Date().getFullYear() : y;
  } catch {
    return new Date().getFullYear();
  }
}

function getDayOfWeek(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day)).getUTCDay();
  }
  return new Date(dateStr).getDay();
}

export function getContributionWeeks(
  contributions: ContributionDay[]
): (ContributionDay | undefined)[][] {
  if (!contributions || contributions.length === 0) return [];

  const weeks: (ContributionDay | undefined)[][] = [];
  let currentWeek: (ContributionDay | undefined)[] = new Array(7).fill(undefined);

  for (const day of contributions) {
    if (!day || !day.date) continue;
    const dayOfWeek = getDayOfWeek(day.date);

    if (dayOfWeek === 0 && currentWeek.some((d) => d !== undefined)) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(undefined);
    }

    currentWeek[dayOfWeek] = day;
  }

  if (currentWeek.some((d) => d !== undefined)) {
    weeks.push(currentWeek);
  }

  return weeks;
}

export function getRecentContributionWeeks(
  contributions: ContributionDay[],
  columns: number
): (ContributionDay | undefined)[][] {
  const allWeeks = getContributionWeeks(contributions);
  const recentWeeks = allWeeks.slice(-columns);

  while (recentWeeks.length < columns) {
    recentWeeks.unshift(new Array(7).fill(undefined));
  }

  return recentWeeks;
}

export function getMonthHeaders(
  contributions: ContributionDay[],
  columns: number
): { col: number; label: string }[] {
  const recentWeeks = getRecentContributionWeeks(contributions, columns);

  const result: { col: number; label: string }[] = [];
  let lastMonth = '';

  for (let col = 0; col < columns; col++) {
    const week = recentWeeks[col];
    const validDay = week.find((d) => d && d.date);
    if (!validDay || !validDay.date) continue;

    const parts = validDay.date.split('-');
    if (parts.length < 2) continue;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2] || '1', 10);
    const dateObj = new Date(Date.UTC(year, month, day));
    const m = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

    if (m !== lastMonth) {
      lastMonth = m;
      result.push({ col, label: m });
    }
  }

  return result;
}

export function generateHeatmapSvg({
  contributions,
  levelColors,
  columns = 53,
  cellSize,
  cellGap = 3,
  radius = 2.5,
  width,
}: {
  contributions: ContributionDay[];
  levelColors: string[];
  columns?: number;
  cellSize?: number;
  cellGap?: number;
  radius?: number;
  width?: number;
}): string {
  const recentWeeks = getRecentContributionWeeks(contributions, columns);

  const finalCellSize =
    cellSize || (width ? Math.max(2, Math.floor((width - (columns - 1) * cellGap) / columns)) : 11);
  const calculatedWidth = width || (columns * finalCellSize + (columns - 1) * cellGap);
  const actualHeight = 7 * finalCellSize + 6 * cellGap;

  let rects = '';

  for (let col = 0; col < columns; col++) {
    const week = recentWeeks[col];
    for (let row = 0; row < 7; row++) {
      const day = week[row];
      if (!day || !day.date) {
        continue;
      }

      const level = day.level >= 0 && day.level <= 4 ? day.level : 0;
      const color = levelColors[level] || levelColors[0];
      const x = col * (finalCellSize + cellGap);
      const y = row * (finalCellSize + cellGap);

      rects += `<rect x="${x}" y="${y}" width="${finalCellSize}" height="${finalCellSize}" rx="${radius}" fill="${color}" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${calculatedWidth} ${actualHeight}" width="${calculatedWidth}" height="${actualHeight}">${rects}</svg>`;
}

export const GitHubApi = {
  async fetchUser(username: string): Promise<GitHubUser> {
    const cleanUsername = username.trim().toLowerCase();
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
      headers: {
        'User-Agent': 'GitGlance-Widgets',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status === 404) {
      throw new Error(`GitHub user "${username}" was not found.`);
    }

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}). Please try again later.`);
    }

    return (await res.json()) as GitHubUser;
  },

  async fetchContributions(username: string): Promise<ContributionData> {
    const cleanUsername = username.trim().toLowerCase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(cleanUsername)}?y=last`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Could not fetch contribution history for "${username}".`);
    }

    const json = await res.json();
    const days: ContributionDay[] = (json.contributions || []).map((c: any) => ({
      date: c.date,
      count: c.count,
      level: (c.level >= 0 && c.level <= 4 ? c.level : 0) as 0 | 1 | 2 | 3 | 4,
    }));

    const streaks = calculateStreaks(days);
    const currentYear = new Date().getFullYear().toString();
    const totalYear = json.total?.[currentYear] || json.total?.lastYear || days.reduce((a, b) => a + b.count, 0);

    return {
      total: {
        [currentYear]: totalYear,
        lastYear: totalYear,
      },
      contributions: days,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      committedToday: streaks.committedToday,
      todayCount: streaks.todayCount,
    };
  },

  async fetchRecord(username: string): Promise<{ user: GitHubUser; contributions: ContributionData }> {
    const [user, contributions] = await Promise.all([
      this.fetchUser(username),
      this.fetchContributions(username),
    ]);
    return { user, contributions };
  },
};
