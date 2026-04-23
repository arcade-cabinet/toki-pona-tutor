import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riversreckoning.game',
  appName: 'Rivers Reckoning',
  webDir: 'dist',
  server: {
    // Allow localhost/devserver access from the Android emulator during dev.
    androidScheme: 'https',
  },
  android: {
    // Keep the web view embedded — no system browser redirect on link taps
    // until we have an actual external link to route.
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#111111',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#111111',
    },
  },
};

export default config;
