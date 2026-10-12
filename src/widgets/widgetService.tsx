import React from 'react';
import { NativeModules, Platform } from 'react-native';
import {
  requestPinWidget,
  requestWidgetUpdate,
} from 'react-native-android-widget';
import { AppStorage } from '../storage';
import { GitHubApi } from '../api';
import { getTheme } from '../themes';
import { MasterCardWidget } from './MasterCardWidget';
import { ProfileWidget } from './ProfileWidget';
import { WidgetType } from '../types';

export const isNativeSupported =
  Platform.OS === 'android' && Boolean(NativeModules.AndroidWidget);

export const WidgetService = {
  isSupported(): boolean {
    return isNativeSupported;
  },

  async pin(widgetName: WidgetType): Promise<{ success: boolean; message: string; isExpoGo?: boolean }> {
    if (!isNativeSupported) {
      return {
        success: false,
        isExpoGo: true,
        message:
          "Home screen widgets require native Android linking, which is not included in Expo Go.\n\nTo build a native app with widgets on your home screen:\nRun: npx eas-cli build -p android --profile preview\n\nLive preview works directly inside this app!",
      };
    }

    try {
      const pinned = await requestPinWidget({ widgetName });
      if (pinned) {
        return {
          success: true,
          message: 'Widget request sent! Check your home screen.',
        };
      }
      return {
        success: false,
        message: 'Could not pin widget automatically. You can add it manually from your Android widget picker.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Error requesting widget pin.',
      };
    }
  },

  async updateAll(): Promise<void> {
    if (!isNativeSupported) return;

    try {
      const username = await AppStorage.getUsername();
      const themeId = await AppStorage.getThemeId();
      const theme = getTheme(themeId);
      const { user, contributions } = await GitHubApi.fetchRecord(username);

      await requestWidgetUpdate({
        widgetName: 'ContributionGraph',
        renderWidget: (info) => (
          <MasterCardWidget
            user={user}
            contributions={contributions}
            theme={theme}
            width={info.width}
            height={info.height}
          />
        ),
      });

      await requestWidgetUpdate({
        widgetName: 'ProfileCard',
        renderWidget: (info) => (
          <ProfileWidget
            user={user}
            contributions={contributions}
            theme={theme}
            width={info.width}
            height={info.height}
          />
        ),
      });
    } catch {
      // Graceful fallback
    }
  },
};
