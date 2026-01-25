'use client';

import React from 'react';
import type { MarketType } from '@/types';

interface MarketTabsProps {
  markets: MarketType[];
  activeMarket: MarketType | null;
  onMarketChange: (market: MarketType) => void;
}

const MARKET_LABELS: Record<string, string> = {
  h2h: 'Match Result',
  spreads: 'Handicap',
  totals: 'Over/Under',
  btts: 'Both Teams to Score',
  draw_no_bet: 'Draw No Bet',
  double_chance: 'Double Chance',
  alternate_spreads: 'Alternate Handicap',
  alternate_totals: 'Alternate Totals',
  team_totals: 'Team Totals',
  alternate_team_totals: 'Alternate Team Totals',
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
