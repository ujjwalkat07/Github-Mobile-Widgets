import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetThemeId, GitHubUser, ContributionData } from './types';
import { DEFAULT_THEME_ID } from './themes';

const STORAGE_KEYS = {
  USERNAME: '@gitglance_user',
  THEME: '@gitglance_theme',
  CACHE_PREFIX: '@gitglance_cache_',
};

export const AppStorage = {
  async getUsername(): Promise<string> {
    try {
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USERNAME);
      return user || 'torvalds';
    } catch {
      return 'torvalds';
    }
  },

  async setUsername(username: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, username.trim().toLowerCase());
    } catch (e) {
      console.warn('Storage error:', e);
    }
  },

  async getThemeId(): Promise<WidgetThemeId> {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return (theme as WidgetThemeId) || DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  },

  async setThemeId(themeId: WidgetThemeId): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, themeId);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  },

  async cacheData(
    username: string,
    data: { user: GitHubUser; contributions: ContributionData }
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CACHE_PREFIX}${username.toLowerCase()}`,
        JSON.stringify({ ...data, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Cache error:', e);
    }
  },

  async getCachedData(
    username: string
  ): Promise<{ user: GitHubUser; contributions: ContributionData } | null> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}${username.toLowerCase()}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return null;
  },
};
