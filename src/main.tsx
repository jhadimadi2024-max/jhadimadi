import './config/appConfig';
import './utils/patchFetch';
import { clearBrowserResidualStorage } from './utils/clearBrowserResiduals';
import { initSafeAnalyticsShims } from './utils/safeScriptLoader';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker';

// Programmatically clear browser caches and residual Supabase auth tokens
try {
  clearBrowserResidualStorage();
  initSafeAnalyticsShims();
} catch (_) {}

// Guarantee root and document are cleared from splash artifacts before React mounts
try {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('splash-active');
    if (document.body) {
      document.body.classList.remove('splash-active');
    }
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.classList.remove('splash-active');
      rootEl.style.removeProperty('background-color');
    }
    const preHydrate = document.getElementById('pre-hydration-splash');
    if (preHydrate) {
      preHydrate.style.display = 'none';
    }
  }
} catch (_) {}

// Initialize React App
const rootContainer = document.getElementById('root');
if (rootContainer) {
  const root = createRoot(rootContainer);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Register Service Worker for offline caching & progressive web capabilities asynchronously in the background
if (typeof window !== 'undefined') {
  const initSW = () => {
    try {
      registerServiceWorker(() => {
        console.log('Jhadimadi App updated in background.');
      });
    } catch (_) {}
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(initSW, { timeout: 3500 });
  } else {
    setTimeout(initSW, 1500);
  }
}



