'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Filter, RefreshCw } from 'lucide-react';

type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'partially_won';

interface SportsBet {
  bet_id: string;
  user_id: string;
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

interface BetWithLegs {
  bet: SportsBet;
  legs: BetLeg[];
}

const STATUS_LABELS: Record<BetStatus, string> = {
  pending: 'Pending',
  won: 'Won',
  lost: 'Lost',
  void: 'Void',
  partially_won: 'Partial Win',
};

const STATUS_COLORS: Record<BetStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
  void: 'bg-gray-500/20 text-gray-300',
  partially_won: 'bg-blue-500/20 text-blue-400',
};

export const BetHistory: React.FC = () => {
  const [bets, setBets] = useState<SportsBet[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | BetStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBet, setSelectedBet] = useState<BetWithLegs | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchBets = useCallback(async () => {
    try {
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('You must be logged in to view your bets.');
        setBets([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const query = params.toString();
      const url = `http://localhost:3001/api/betting/my-bets${query ? `?${query}` : ''}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch bets (${res.status})`);
      }

      const data = (await res.json()) as SportsBet[];
      setBets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bet history:', err);
      setBets([]);
      setError(err instanceof Error ? err.message : 'Failed to load bet history.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchBetDetails = useCallback(async (betId: string) => {
    try {
      setDetailsLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('You must be logged in to view bet details.');
        return;
      }

      const res = await fetch(`http://localhost:3001/api/betting/bet/${betId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch bet details (${res.status})`);
      }

      const data = (await res.json()) as BetWithLegs;
      setSelectedBet(data);
    } catch (err) {
      console.error('Error fetching bet details:', err);
      setSelectedBet(null);
      setError(err instanceof Error ? err.message : 'Failed to load bet details.');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // Initial load + refetch when filter changes
  useEffect(() => {
    setLoading(true);
    fetchBets();
  }, [fetchBets]);

  // Poll for status updates while there are pending bets
  useEffect(() => {
    const hasPending = bets.some((b) => b.status === 'pending');
    if (!hasPending) {
      return;
    }

    const id = setInterval(() => {
      fetchBets();
    }, 30000);

    return () => clearInterval(id);
  }, [bets, fetchBets]);

  const handleRefresh = () => {
    setLoading(true);
    fetchBets();
  };

  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white">Bet History</h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Track your sports bets and their results in real time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs sm:text-sm text-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center text-xs text-gray-400 mr-2">
          <Filter className="w-4 h-4 mr-1" />
          <span>Status</span>
        </div>
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'won', label: 'Won' },
          { id: 'lost', label: 'Lost' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as 'all' | BetStatus)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === f.id
                ? 'bg-green-500 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading your bets...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-300 font-medium mb-2">No bets found</p>
          <p className="text-gray-500 text-sm">
            Place a sports bet and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-gray-700/60">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60">
                <tr className="text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left py-3 px-3 sm:px-4">Date</th>
                  <th className="text-left py-3 px-3 sm:px-4 hidden sm:table-cell">
                    Sport
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4">Type</th>
                  <th className="text-right py-3 px-3 sm:px-4">Stake</th>
                  <th className="text-right py-3 px-3 sm:px-4 hidden sm:table-cell">
                    Potential
                  </th>
                  <th className="text-right py-3 px-3 sm:px-4">Status</th>
                  <th className="text-right py-3 px-3 sm:px-4">Payout</th>
                  <th className="text-right py-3 px-3 sm:px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr
                    key={bet.bet_id}
                    className="border-t border-gray-700/60 hover:bg-gray-900/60 transition-colors"
                  >
                    <td className="py-3 px-3 sm:px-4 text-gray-200">
                      {formatDateTime(bet.created_at)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-300 hidden sm:table-cell">
                      {bet.sport_key || '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-200 capitalize">
                      {bet.bet_type}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right text-gray-200">
                      {bet.total_stake.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right text-gray-300 hidden sm:table-cell">
                      {bet.potential_payout.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-semibold ${
                          STATUS_COLORS[bet.status]
                        }`}
                      >
                        {STATUS_LABELS[bet.status]}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right text-gray-200">
                      {bet.payout > 0 ? `${bet.payout.toLocaleString()} pts` : '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <button
                        onClick={() =>
                          selectedBet?.bet.bet_id === bet.bet_id
                            ? setSelectedBet(null)
                            : fetchBetDetails(bet.bet_id)
                        }
                        className="text-xs text-green-400 hover:text-green-300 underline"
                      >
                        {selectedBet?.bet.bet_id === bet.bet_id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Details panel */}
          {selectedBet && (
            <div className="mt-4 border border-gray-700/60 rounded-lg p-4 bg-gray-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Bet #{selectedBet.bet.bet_id.slice(0, 8)}
                  </h4>
                  <p className="text-xs text-gray-400">
                    Placed {formatDateTime(selectedBet.bet.created_at)}
                    {selectedBet.bet.settled_at &&
                      ` • Settled ${formatDateTime(selectedBet.bet.settled_at)}`}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Stake</p>
                    <p className="text-gray-100 font-semibold">
                      {selectedBet.bet.total_stake.toLocaleString()} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Potential</p>
                    <p className="text-gray-100 font-semibold">
                      {selectedBet.bet.potential_payout.toLocaleString()} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Payout</p>
                    <p className="text-gray-100 font-semibold">
                      {selectedBet.bet.payout > 0
                        ? `${selectedBet.bet.payout.toLocaleString()} pts`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {detailsLoading ? (
                <div className="py-4 text-sm text-gray-400">Loading bet details...</div>
              ) : (
                <div className="space-y-2">
                  {selectedBet.legs.map((leg) => (
                    <div
                      key={leg.leg_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-700/60 rounded-lg px-3 py-2 bg-gray-900/80"
                    >
                      <div>
                        <p className="text-sm text-white font-medium">
                          {leg.home_team} vs {leg.away_team}
                        </p>
                        <p className="text-xs text-gray-400">
                          {leg.league || leg.sport_key || ''} •{' '}
                          {leg.market_type.replace('_', ' ')} • Selection:{' '}
                          <span className="font-semibold text-gray-100">
                            {leg.selection.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {leg.commence_time ? formatDateTime(leg.commence_time) : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-right">
                          <p className="text-gray-400">Odds</p>
                          <p className="text-yellow-400 font-semibold">
                            {Number(leg.odds_when_placed).toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-semibold ${
                            STATUS_COLORS[
                              (leg.status as BetStatus) in STATUS_COLORS
                                ? (leg.status as BetStatus)
                                : 'pending'
                            ]
                          }`}
                        >
                          {STATUS_LABELS[
                            (leg.status as BetStatus) in STATUS_LABELS
                              ? (leg.status as BetStatus)
                              : 'pending'
                          ]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

