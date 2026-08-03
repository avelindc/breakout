import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.test.app',
  appName: 'TestApp',
  webDir: 'public',
  server: {
    url: 'https://breakoutmusic.online'
  }
};

export default config;
