import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deligent.watchmaker',
  appName: 'WatchMaker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
