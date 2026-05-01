'use client';

import React from 'react';
import { Activity, AlertTriangle, Coins, TrendingUp } from 'lucide-react';

export interface BettingStats {
  totalBets: number;
  totalStake: number;
  pendingExposure: number;
  settledPL: number;
  winRate: number; // 0–100
}

interface BettingStatsCardsProps {
  stats: BettingStats;
}

export const BettingStatsCards: React.FC<BettingStatsCardsProps> = ({ stats }) => {
  const plColor =
    stats.settledPL > 0
      ? 'text-green-400'
      : stats.settledPL < 0
      ? 'text-red-400'
      : 'text-gray-200';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
      <div className="bg-dark-bg border border-primary-green/30 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Bets</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalBets}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-green/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-accent-green" />
        </div>
      </div>

      <div className="bg-dark-bg border border-primary-green/30 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Stake Volume</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.totalStake.toLocaleString()} pts
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-green/20 flex items-center justify-center">
          <Coins className="w-5 h-5 text-accent-green" />
        </div>
      </div>

      <div className="bg-dark-bg border border-primary-green/30 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Pending Exposure</p>
          <p className="text-2xl font-bold text-yellow-300 mt-1">
            {stats.pendingExposure.toLocaleString()} pts
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      <div className="bg-dark-bg border border-primary-green/30 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Settled P&amp;L</p>
            <p className={`text-2xl font-bold mt-1 ${plColor}`}>
              {stats.settledPL === 0
                ? '0 pts'
                : `${stats.settledPL > 0 ? '+' : ''}${stats.settledPL.toLocaleString()} pts`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-green/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-green" />
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Win rate:{' '}
          <span className="text-accent-green font-semibold">
            {Number.isFinite(stats.winRate) ? stats.winRate.toFixed(1) : '0.0'}%
          </span>
        </div>
      </div>
    </div>
  );
};

