'use client';

import React from 'react';
import { X, User, Mail, Coins, Clock } from 'lucide-react';

type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'partially_won';

interface MonitoredBet {
  bet_id: string;
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

interface BetDetailsModalProps {
  isOpen: boolean;
  loading?: boolean;
  bet: MonitoredBet | null;
  legs: BetLeg[];
  onClose: () => void;
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

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const BetDetailsModal: React.FC<BetDetailsModalProps> = ({
  isOpen,
  loading,
  bet,
  legs,
  onClose,
}) => {
  if (!isOpen || !bet) return null;

  const plColor =
    bet.payout > bet.total_stake
      ? 'text-green-400'
      : bet.payout < bet.total_stake && bet.payout > 0
      ? 'text-yellow-300'
      : bet.payout === 0
      ? 'text-red-400'
      : 'text-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-dark-bg border border-primary-green/40 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-primary-green/30">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Bet Details</p>
            <h3 className="text-lg font-semibold text-white">
              Bet #{bet.bet_id.slice(0, 8)} • {bet.bet_type.toUpperCase()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-primary-green/20 text-gray-200"
            aria-label="Close bet details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
          {/* User + summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-primary-green/10 border border-primary-green/30 rounded-xl p-3 flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-primary-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {bet.user_name || 'User'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Mail className="w-3 h-3" />
                  <span>{bet.user_email || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span
                  className={`px-2 py-1 rounded-full font-semibold ${
                    STATUS_COLORS[bet.status]
                  }`}
                >
                  {STATUS_LABELS[bet.status]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Stake</span>
                <span className="text-gray-100 font-semibold">
                  {bet.total_stake.toLocaleString()} pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Potential</span>
                <span className="text-gray-100 font-semibold">
                  {bet.potential_payout.toLocaleString()} pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Payout</span>
                <span className={`font-semibold ${plColor}`}>
                  {bet.payout > 0
                    ? `${bet.payout.toLocaleString()} pts`
                    : bet.status === 'pending'
                    ? '-'
                    : '0 pts'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                Placed: <span className="text-gray-200">{formatDateTime(bet.created_at)}</span>
              </span>
            </div>
            {bet.settled_at && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  Settled:{' '}
                  <span className="text-gray-200">{formatDateTime(bet.settled_at)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Legs */}
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Coins className="w-4 h-4 text-accent-green" />
              <span>Selections ({legs.length})</span>
            </h4>
            {loading ? (
              <div className="py-4 text-sm text-gray-400">Loading legs...</div>
            ) : (
              <div className="space-y-2">
                {legs.map((leg) => (
                  <div
                    key={leg.leg_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-700/70 rounded-lg px-3 py-2 bg-gray-900/80"
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

          {/* Admin actions placeholder */}
          <div className="mt-3 pt-3 border-t border-gray-700/60 text-xs text-gray-400">
            Manual settlement controls (void bet, mark as won/lost) can be added here in a later
            phase.
          </div>
        </div>
      </div>
    </div>
  );
};

