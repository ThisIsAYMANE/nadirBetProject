'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { BettingStatsCards, BettingStats } from './BettingStatsCards';
import { BetDetailsModal } from './BetDetailsModal';
import { apiService } from '../../services/api';
import type { DashboardType } from '../../types';

type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'partially_won';

interface MonitoredBet {
  bet_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  bet_type: 'single' | 'accumulator';
  total_stake: number;
  potential_payout: number;
  payout: number;
  status: BetStatus;
  sport_key?: string | null;
  created_at: string;
  settled_at?: string | null;
}

interface BetLeg {
  leg_id: string;
  bet_id: string;
  sport_key?: string | null;
  league?: string | null;
  event_id: string;
  home_team: string;
  away_team: string;
  market_type: string;
  selection: string;
  line?: string | null;
  odds_when_placed: number;
  status: BetStatus | 'void';
  commence_time?: string | null;
}

interface BetDetailsResponse {
  bet: MonitoredBet;
  legs: BetLeg[];
}

interface BetMonitoringDashboardProps {
  dashboardType: DashboardType['type'];
}

export const BetMonitoringDashboard: React.FC<BetMonitoringDashboardProps> = ({
  dashboardType,
}) => {
  const [bets, setBets] = useState<MonitoredBet[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | BetStatus>('pending');
  const [sportFilter, setSportFilter] = useState<'all' | string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBet, setSelectedBet] = useState<MonitoredBet | null>(null);
  const [selectedLegs, setSelectedLegs] = useState<BetLeg[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchBets = useCallback(async () => {
    try {
      setError(null);
      const data = await apiService.getMonitoredBets({
        status: statusFilter === 'all' ? undefined : statusFilter,
        sportKey: sportFilter === 'all' ? undefined : sportFilter,
        limit: 200,
      });

      const rows = Array.isArray(data) ? data : data?.bets || [];
      setBets(rows as MonitoredBet[]);
    } catch (err) {
      console.error('Error loading monitored bets:', err);
      setBets([]);
      setError(err instanceof Error ? err.message : 'Failed to load bets.');
    } finally {
      setLoading(false);
    }
  }, [sportFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchBets();
  }, [fetchBets]);

  // Basic polling while there are pending bets
  useEffect(() => {
    const hasPending = bets.some((b) => b.status === 'pending');
    if (!hasPending) return;

    const id = setInterval(() => {
      fetchBets();
    }, 30000);

    return () => clearInterval(id);
  }, [bets, fetchBets]);

  const handleOpenDetails = async (bet: MonitoredBet) => {
    setSelectedBet(bet);
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const data = (await apiService.getBetDetails(bet.bet_id)) as BetDetailsResponse;
      setSelectedLegs(data.legs || []);
    } catch (err) {
      console.error('Error loading bet details:', err);
      setSelectedLegs([]);
      setError(err instanceof Error ? err.message : 'Failed to load bet details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const stats: BettingStats = useMemo(() => {
    if (!bets.length) {
      return {
        totalBets: 0,
        totalStake: 0,
        pendingExposure: 0,
        settledPL: 0,
        winRate: 0,
      };
    }

    const totalBets = bets.length;
    const totalStake = bets.reduce((sum, b) => sum + (b.total_stake || 0), 0);
    const pendingExposure = bets
      .filter((b) => b.status === 'pending')
      .reduce((sum, b) => sum + (b.potential_payout || 0), 0);

    const settled = bets.filter((b) => b.status !== 'pending');
    const settledPL = settled.reduce((sum, b) => {
      const stake = b.total_stake || 0;
      const payout = b.payout || 0;
      return sum + (payout - stake);
    }, 0);

    const settledCount = settled.length || 1;
    const wonCount = settled.filter((b) => b.status === 'won' || b.status === 'partially_won')
      .length;
    const winRate = (wonCount / settledCount) * 100;

    return {
      totalBets,
      totalStake,
      pendingExposure,
      settledPL,
      winRate,
    };
  }, [bets]);

  const uniqueSports = useMemo(() => {
    const keys = Array.from(
      new Set(
        bets
          .map((b) => b.sport_key)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    );
    return keys;
  }, [bets]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-green" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Bet Monitoring</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {dashboardType === 'super_admin'
                ? 'Monitor all platform bets and exposure.'
                : 'Monitor bets for users under your management.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <BettingStatsCards stats={stats} />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'won', 'lost'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as 'all' | BetStatus)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-accent-green text-primary-green'
                  : 'bg-dark-bg text-gray-300 hover:bg-primary-green/30'
              }`}
            >
              {status === 'all'
                ? 'All'
                : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}

          <select
            aria-label="Sport filter"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs bg-dark-bg border border-primary-green/40 text-gray-200 focus:outline-none focus:border-accent-green"
          >
            <option value="all">All sports</option>
            {uniqueSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading bets...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      ) : bets.length === 0 ? (
        <div className="bg-dark-bg border border-gray-700 rounded-lg p-6 text-center text-sm text-gray-400">
          No bets found for the selected filters.
        </div>
      ) : (
        <div className="bg-dark-bg border border-gray-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-green/10">
              <tr className="text-xs text-gray-300 uppercase tracking-wide">
                <th className="text-left py-3 px-3 sm:px-4">Date</th>
                <th className="text-left py-3 px-3 sm:px-4">User</th>
                <th className="text-left py-3 px-3 sm:px-4 hidden md:table-cell">
                  Sport
                </th>
                <th className="text-left py-3 px-3 sm:px-4">Type</th>
                <th className="text-right py-3 px-3 sm:px-4">Stake</th>
                <th className="text-right py-3 px-3 sm:px-4 hidden md:table-cell">
                  Potential
                </th>
                <th className="text-right py-3 px-3 sm:px-4">Payout</th>
                <th className="text-right py-3 px-3 sm:px-4">Status</th>
                <th className="text-right py-3 px-3 sm:px-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet) => (
                <tr
                  key={bet.bet_id}
                  className="border-t border-gray-700 hover:bg-primary-green/5 transition-colors"
                >
                  <td className="py-3 px-3 sm:px-4 text-gray-200">
                    {new Date(bet.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-gray-100">
                    <div className="text-xs sm:text-sm font-medium">
                      {bet.user_name || 'User'}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {bet.user_email || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-gray-200 hidden md:table-cell">
                    {bet.sport_key || '-'}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-gray-200 capitalize">
                    {bet.bet_type}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right text-gray-100">
                    {bet.total_stake.toLocaleString()} pts
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right text-gray-200 hidden md:table-cell">
                    {bet.potential_payout.toLocaleString()} pts
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right text-gray-100">
                    {bet.payout > 0 ? `${bet.payout.toLocaleString()} pts` : '-'}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-semibold ${
                        bet.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : bet.status === 'won' || bet.status === 'partially_won'
                          ? 'bg-green-500/20 text-green-400'
                          : bet.status === 'lost'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {bet.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right">
                    <button
                      onClick={() => handleOpenDetails(bet)}
                      className="text-xs text-accent-green hover:text-white underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BetDetailsModal
        isOpen={detailsOpen}
        loading={detailsLoading}
        bet={selectedBet}
        legs={selectedLegs}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
};

