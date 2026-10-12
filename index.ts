import { registerRootComponent } from 'expo';
import { NativeModules, Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { widgetHandler } from './src/widgets/widgetHandler';

// Safely register widget task handler on Android
if (Platform.OS === 'android' && Boolean(NativeModules.AndroidWidget)) {
  try {
    registerWidgetTaskHandler(widgetHandler);
  } catch {
    // Graceful fallback for Expo Go
  }
}

registerRootComponent(App);
