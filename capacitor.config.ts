import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cn.local.ziweichart',
  appName: '紫微命盘',
  webDir: 'mobile/dist',
  loggingBehavior: 'none',
  android: {
    backgroundColor: '#020810',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
