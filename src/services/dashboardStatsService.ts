import { supabase, isSupabaseConfigured } from '../supabase';
import { databaseService } from './databaseService';
import { useState, useEffect, useCallback } from 'react';

export interface LiveDatabaseStats {
  totalRegisteredDonors: number;
  totalActiveSellers: number;
  totalServiceProviders: number;
  totalProducts: number;
  totalOrders: number;
  totalComplaints: number;
  lastUpdated: string;
  isLive: boolean;
}

/**
 * Executes a COUNT query on a Supabase table with graceful fallback.
 * Uses exact row count via HTTP HEAD request when supported.
 */
async function queryTableCount(
  tableName: string,
  fallbackQuery?: () => Promise<number>
): Promise<number> {
  if (!isSupabaseConfigured) {
    if (fallbackQuery) return await fallbackQuery();
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!error && typeof count === 'number') {
      return count;
    }

    // If dedicated table is not present in schema cache or lacks permissions, try fallback
    if (fallbackQuery) {
      return await fallbackQuery();
    }
    return 0;
  } catch {
    if (fallbackQuery) {
      try {
        return await fallbackQuery();
      } catch {
        return 0;
      }
    }
    return 0;
  }
}

/**
 * Fetch dynamic production row counts directly from Supabase.
 * Strictly initializes to '0' (Zero Base).
 */
export async function fetchProductionDatabaseStats(): Promise<LiveDatabaseStats> {
  // 1. Total Registered Donors: SELECT COUNT(*) FROM blood_donors;
  const donorsPromise = queryTableCount('blood_donors', async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'blood_donor');
      return typeof count === 'number' ? count : 0;
    } catch {
      return 0;
    }
  });

  // 2. Total Active Sellers: SELECT COUNT(*) FROM sellers;
  const sellersPromise = queryTableCount('sellers', async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');
      return typeof count === 'number' ? count : 0;
    } catch {
      return 0;
    }
  });

  // 3. Total Service Providers: SELECT COUNT(*) FROM service_providers;
  const providersPromise = queryTableCount('service_providers', async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['service_provider', 'provider', 'professional']);
      return typeof count === 'number' ? count : 0;
    } catch {
      return 0;
    }
  });

  // 4. Total Products
  const productsPromise = queryTableCount('products', async () => {
    return 0;
  });

  // 5. Total Orders
  const ordersPromise = queryTableCount('orders', async () => {
    return 0;
  });

  // 6. Total Complaints
  const complaintsPromise = queryTableCount('complaints', async () => {
    return 0;
  });

  const [
    donorsCount,
    sellersCount,
    providersCount,
    productsCount,
    ordersCount,
    complaintsCount
  ] = await Promise.all([
    donorsPromise,
    sellersPromise,
    providersPromise,
    productsPromise,
    ordersPromise,
    complaintsPromise
  ]);

  return {
    totalRegisteredDonors: donorsCount || 0,
    totalActiveSellers: sellersCount || 0,
    totalServiceProviders: providersCount || 0,
    totalProducts: productsCount || 0,
    totalOrders: ordersCount || 0,
    totalComplaints: complaintsCount || 0,
    lastUpdated: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isLive: true
  };
}

/**
 * React hook for consuming live Supabase statistics in admin & user dashboards.
 * Initial values are strictly 0 (Zero Base) with loading state tracking.
 */
export function useDashboardLiveStats(contextFallbacks?: {
  productsCount?: number;
  ordersCount?: number;
  sellersCount?: number;
  providersCount?: number;
  donorsCount?: number;
  complaintsCount?: number;
}) {
  const [stats, setStats] = useState<LiveDatabaseStats>({
    totalRegisteredDonors: 0,
    totalActiveSellers: 0,
    totalServiceProviders: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalComplaints: 0,
    lastUpdated: '',
    isLive: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStats = useCallback(async () => {
    try {
      const dbStats = await fetchProductionDatabaseStats();
      
      // Combine with real local/context count if DB table is empty or unpopulated
      setStats({
        totalRegisteredDonors: dbStats.totalRegisteredDonors > 0 
          ? dbStats.totalRegisteredDonors 
          : (contextFallbacks?.donorsCount ?? 0),
        totalActiveSellers: dbStats.totalActiveSellers > 0 
          ? dbStats.totalActiveSellers 
          : (contextFallbacks?.sellersCount ?? 0),
        totalServiceProviders: dbStats.totalServiceProviders > 0 
          ? dbStats.totalServiceProviders 
          : (contextFallbacks?.providersCount ?? 0),
        totalProducts: dbStats.totalProducts > 0 
          ? dbStats.totalProducts 
          : (contextFallbacks?.productsCount ?? 0),
        totalOrders: dbStats.totalOrders > 0 
          ? dbStats.totalOrders 
          : (contextFallbacks?.ordersCount ?? 0),
        totalComplaints: dbStats.totalComplaints > 0 
          ? dbStats.totalComplaints 
          : (contextFallbacks?.complaintsCount ?? 0),
        lastUpdated: dbStats.lastUpdated,
        isLive: true
      });
    } catch (err) {
      console.warn('[DashboardStats] Notice during live fetch:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    contextFallbacks?.donorsCount,
    contextFallbacks?.sellersCount,
    contextFallbacks?.providersCount,
    contextFallbacks?.productsCount,
    contextFallbacks?.ordersCount,
    contextFallbacks?.complaintsCount
  ]);

  useEffect(() => {
    loadStats();

    // Subscribe to real database entity mutations
    const unsub = databaseService.subscribe(() => {
      loadStats();
    });

    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [loadStats]);

  return {
    stats,
    isLoading,
    refresh: loadStats
  };
}
