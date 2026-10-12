import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { AppStorage } from '../storage';
import { GitHubApi } from '../api';
import { getTheme } from '../themes';
import { MasterCardWidget } from './MasterCardWidget';
import { ProfileWidget } from './ProfileWidget';

export async function widgetHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  try {
    const activeUsername = await AppStorage.getUsername();
    const activeThemeId = await AppStorage.getThemeId();
    const theme = getTheme(activeThemeId);

    let data = await AppStorage.getCachedData(activeUsername);
    if (!data) {
      data = await GitHubApi.fetchRecord(activeUsername);
    }

    const { user, contributions } = data;

    if (widgetInfo.widgetName === 'ProfileCard') {
      renderWidget(
        <ProfileWidget
          user={user}
          contributions={contributions}
          theme={theme}
          width={widgetInfo.width}
          height={widgetInfo.height}
        />
      );
    } else {
      renderWidget(
        <MasterCardWidget
          user={user}
          contributions={contributions}
          theme={theme}
          width={widgetInfo.width}
          height={widgetInfo.height}
        />
      );
    }
  } catch (error) {
    console.warn('Widget render task error:', error);
  }
}
