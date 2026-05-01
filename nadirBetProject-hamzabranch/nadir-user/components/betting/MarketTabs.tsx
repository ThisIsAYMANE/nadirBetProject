'use client';

import React from 'react';
import type { MarketType } from '@/types';

interface MarketTabsProps {
  markets: MarketType[];
  activeMarket: MarketType | null;
  onMarketChange: (market: MarketType) => void;
}

const MARKET_LABELS: Record<string, string> = {
  // Standard
  h2h: 'Match Result',
  spreads: 'Handicap',
  totals: 'Over/Under',
  btts: 'Both Teams to Score',
  draw_no_bet: 'Draw No Bet',
  double_chance: 'Double Chance',
  alternate_spreads: 'Alt. Handicap',
  alternate_totals: 'Alt. Over/Under',
  team_totals: 'Team Totals',
  alternate_team_totals: 'Alt. Team Totals',
  // API-Sports specific
  correct_score: 'Correct Score',
  h2h_1h: '1st Half Result',
  h2h_2h: '2nd Half Result',
  ht_ft: 'HT/FT',
  odd_even: 'Odd / Even',
  result_btts: 'Result + BTTS',
  home_totals: 'Home Team O/U',
  away_totals: 'Away Team O/U',
  method: 'Method of Victory',
  round_winner: 'Round Winner',
  try_scorer: 'Try Scorer',
};

export function MarketTabs({ markets, activeMarket, onMarketChange }: MarketTabsProps) {
  if (markets.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
      {markets.map((market) => (
        <button
          key={market}
          onClick={() => onMarketChange(market)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeMarket === market
              ? 'bg-green-500 text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {MARKET_LABELS[market] || market.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </button>
      ))}
    </div>
  );
}
