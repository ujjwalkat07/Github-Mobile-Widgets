import { WidgetTheme, WidgetThemeId } from './types';

export const THEMES: Record<WidgetThemeId, WidgetTheme> = {
  classic: {
    id: 'classic',
    name: 'shadcn/zinc',
    badge: '🌿 Zinc',
    background: '#09090b',
    cardBackground: '#18181b',
    borderColor: '#27272a',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    accent: '#22c55e',
    levels: ['#27272a', '#064e3b', '#047857', '#059669', '#22c55e'],
  },
  emerald: {
    id: 'emerald',
    name: 'shadcn/emerald',
    badge: '💎 Emerald',
    background: '#04170e',
    cardBackground: '#0a2318',
    borderColor: '#133e2b',
    textPrimary: '#f0fdf4',
    textSecondary: '#86efac',
    accent: '#10b981',
    levels: ['#133e2b', '#065f46', '#059669', '#10b981', '#34d399'],
  },
  amoled: {
    id: 'amoled',
    name: 'shadcn/neutral',
    badge: '🖤 AMOLED',
    background: '#000000',
    cardBackground: '#09090b',
    borderColor: '#27272a',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    accent: '#ffffff',
    levels: ['#18181b', '#27272a', '#52525b', '#a1a1aa', '#ffffff'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'shadcn/cyan',
    badge: '⚡ Cyan',
    background: '#060a12',
    cardBackground: '#0c1524',
    borderColor: '#182b48',
    textPrimary: '#f0f9ff',
    textSecondary: '#7dd3fc',
    accent: '#06b6d4',
    levels: ['#14243b', '#0e7490', '#0891b2', '#06b6d4', '#67e8f9'],
  },
};

export const DEFAULT_THEME_ID: WidgetThemeId = 'classic';

export function getTheme(themeId?: WidgetThemeId): WidgetTheme {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId];
  }
  return THEMES[DEFAULT_THEME_ID];
}
