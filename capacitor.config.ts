import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.watchmaker.app',
  appName: 'WatchMaker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
