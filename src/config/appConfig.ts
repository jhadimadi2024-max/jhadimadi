/**
 * Canonical Application Configuration
 * Explicitly declares mandatory 'id' and 'name' fields to guarantee zero "No ID or name found in config" warnings.
 */

export interface ApplicationConfig {
  id: string;
  name: string;
  appId: string;
  appName: string;
  projectId: string;
  projectName: string;
  title: string;
  short_name: string;
  version: string;
  environment: string;
  description: string;
  platform: string;
  apiUrl: string;
}

export const appConfig: ApplicationConfig = {
  id: 'jhadimadi-superapp',
  name: 'Jhadimadi.com - ঝাদিমাদি ডটকম',
  appId: 'jhadimadi-superapp',
  appName: 'Jhadimadi.com',
  projectId: 'jhadimadi-superapp',
  projectName: 'Jhadimadi.com',
  title: 'Jhadimadi.com - ঝাদিমাদি ডটকম',
  short_name: 'Jhadimadi.com',
  version: '2.5.0',
  environment: typeof process !== 'undefined' && process.env?.NODE_ENV ? process.env.NODE_ENV : 'production',
  description: 'On-demand Hyperlocal Home Services, CHT Organic E-Commerce & Logistics Super-App Platform for Rangamati, Khagrachhari, Bandarban & Bangladesh.',
  platform: 'web',
  apiUrl: '/api',
};

// Bind to window for global runtime availability and framework inspection
if (typeof window !== 'undefined') {
  const win = window as any;
  win.__APP_CONFIG__ = appConfig;
  win.APP_CONFIG = appConfig;
  win.appConfig = appConfig;
  win.__CONFIG__ = appConfig;
  
  // Safe visitor identity and widget configuration
  win.tidioIdentify = win.tidioIdentify || {
    id: 'jhadimadi-guest',
    name: 'Guest Visitor',
    email: 'visitor@jhadimadi.com'
  };
  win.tidioConfig = win.tidioConfig || {
    id: 'rhikfdzcdjdqjewrch3mzvppdtksokyc',
    name: 'Jhadimadi Live Support'
  };

  if (!win.config || typeof win.config !== 'object') {
    win.config = { ...appConfig };
  } else {
    win.config.id = win.config.id || appConfig.id;
    win.config.name = win.config.name || appConfig.name;
    win.config.appId = win.config.appId || appConfig.appId;
    win.config.appName = win.config.appName || appConfig.appName;
    win.config.projectId = win.config.projectId || appConfig.projectId;
    win.config.projectName = win.config.projectName || appConfig.projectName;
    win.config.title = win.config.title || appConfig.title;
    win.config.short_name = win.config.short_name || appConfig.short_name;
  }
}

export default appConfig;
