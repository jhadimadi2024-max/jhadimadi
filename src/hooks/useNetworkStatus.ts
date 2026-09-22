import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isChecking: boolean;
  lastOnlineAt: Date | null;
  checkConnection: () => Promise<boolean>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      // Try to fetch a small lightweight timestamp or ping
      const response = await fetch(`/runner-logo.png?ping=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const online = response.ok || navigator.onLine;
      setIsOnline(online);
      if (online) {
        setLastOnlineAt(new Date());
      }
      setIsChecking(false);
      return online;
    } catch {
      // If network request threw, check navigator as fallback
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(online);
      setIsChecking(false);
      return online;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      setWasOffline(true);
      // Clear wasOffline after a few seconds so re-connected alert hides
      setTimeout(() => {
        setWasOffline(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    isChecking,
    lastOnlineAt,
    checkConnection,
  };
}
