import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'gov.in.smartfarmer.app',
  appName: 'Kisan Vyom',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_kisan_notify',
      iconColor: '#16a34a',
    },
  },
};

export default config;
