import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Coins, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface PointsBalanceCardProps {
  compact?: boolean;
}

export const PointsBalanceCard: React.FC<PointsBalanceCardProps> = ({ compact = false }) => {
  const [balance, setBalance] = useState(0);
  const [available, setAvailable] = useState(0);
  const [allocated, setAllocated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
    // Refresh every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadBalance = async () => {
    try {
      const data = await apiService.getPointsBalance();
      setBalance(data.balance || 0);
      setAvailable(data.available || 0);
      setAllocated(data.allocated || 0);
      setError(null);
    } catch (err) {
      console.error('Error loading balance:', err);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-accent-green/20 to-accent-green/5 border-accent-green/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Available Points</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mt-1"></div>
            ) : error ? (
              <p className="text-red-400 text-sm">{error}</p>
            ) : (
              <p className="text-2xl font-bold text-accent-green">
                {available.toLocaleString()}
              </p>
            )}
          </div>
          <Coins className="w-10 h-10 text-accent-green opacity-50" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card-bg border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Points Overview</h3>
        <Coins className="w-6 h-6 text-accent-green" />
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-6 bg-gray-700 animate-pulse rounded"></div>
          <div className="h-6 bg-gray-700 animate-pulse rounded"></div>
          <div className="h-6 bg-gray-700 animate-pulse rounded"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Balance</span>
            </div>
            <span className="text-xl font-bold text-white">{balance.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Available</span>
            </div>
            <span className="text-xl font-bold text-green-400">{available.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Allocated</span>
            </div>
            <span className="text-xl font-bold text-yellow-400">{allocated.toLocaleString()}</span>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Available = Balance - Allocated to others
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
