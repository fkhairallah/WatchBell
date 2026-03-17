import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deligent.watchbell',
  appName: 'WatchBell',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
