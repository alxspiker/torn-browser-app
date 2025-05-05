import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tornbrowser.app',
  appName: 'Torn Browser',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*.torn.com']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
