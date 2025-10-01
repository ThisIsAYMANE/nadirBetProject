import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Broker, Transaction, KPIData, ChartData } from '../types';
import { apiService } from '../services/api';

interface DashboardData {
  users: User[];
  brokers: Broker[];
  transactions: Transaction[];
  kpis: KPIData[];
  revenueChart: ChartData[];
  performanceChart: ChartData[];
}

interface UseDashboardDataProps {
  dashboardType: 'super_admin' | 'broker';
  brokerId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useDashboardData = ({
  dashboardType,
  brokerId,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes (reduced frequency to prevent constant refreshing)
}: UseDashboardDataProps) => {
  const [data, setData] = useState<DashboardData>({
    users: [],
    brokers: [],
    transactions: [],
    kpis: [],
    revenueChart: [],
    performanceChart: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      const [dashboardData, kpis, revenueChart, performanceChart] = await Promise.all([
        apiService.getDashboardData(dashboardType, brokerId),
        apiService.getKPIs(dashboardType, brokerId),
        apiService.getChartData('revenue', '12months', brokerId),
        apiService.getChartData('performance', '12months', brokerId),
      ]);

      if (!isMountedRef.current) return;

      setData({
        users: dashboardData.users || [],
        brokers: dashboardData.brokers || [],
        transactions: dashboardData.transactions || [],
        kpis: kpis || [],
        revenueChart: revenueChart || [],
        performanceChart: performanceChart || [],
      });

      setLastUpdated(new Date());
    } catch (err) {
      // Don't set error if we're not authenticated (user might be logging out)
      if (err instanceof Error && !err.message.includes('401') && !err.message.includes('403')) {
        setError(err.message);
        console.error('Dashboard data fetch error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [dashboardType, brokerId]);

  // Initial data fetch only when autoRefresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      fetchData();
    }
  }, [fetchData, autoRefresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      try {
        fetchData();
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchData, autoRefresh, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Real-time updates only when authenticated
  useEffect(() => {
    if (!autoRefresh) return;

    const unsubscribe = apiService.subscribeToUpdates((updateData) => {
      if (updateData.type === 'dashboard_update') {
        fetchData();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchData, autoRefresh]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

// Individual data hooks
export const useUsers = (page = 1, limit = 10, search = '') => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers(page, limit, search);
      setUsers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, total, refresh: fetchUsers };
};

export const useBrokers = (page = 1, limit = 10, search = '') => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchBrokers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getBrokers(page, limit, search);
      setBrokers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brokers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  return { brokers, loading, error, total, refresh: fetchBrokers };
};

export const useTransactions = (page = 1, limit = 10, filters: any = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getTransactions(page, limit, filters);
      setTransactions(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, total, refresh: fetchTransactions };
};
