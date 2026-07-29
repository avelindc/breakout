import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.breakoutmusic.app',
  appName: 'Breakout Music',
  webDir: 'public',
  server: {
    url: 'https://breakoutmusic.online',
    cleartext: true
  }
};

export default config;
