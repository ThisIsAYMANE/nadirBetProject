'use client';

import React from 'react';
import { useBetting } from '@/contexts/BettingContext';
import type { MatchMarket, MatchMarketOutcome, MarketType } from '@/types';
import { normalizeToDecimal } from '@/lib/oddsUtils';

interface MarketDisplayProps {
  market: MatchMarket;
  marketType: MarketType;
  homeTeam: string;
  awayTeam: string;
  eventId: string;
  sportKey: string;
  league?: string;
  commenceTime?: string;
}

export function MarketDisplay({
  market,
  marketType,
  homeTeam,
  awayTeam,
  eventId,
  sportKey,
  league,
  commenceTime,
}: MarketDisplayProps) {
  const { addSelection } = useBetting();

  const handleOutcomeClick = (outcome: MatchMarketOutcome) => {
    // Determine selection type based on market type
    let selection: string = outcome.name.toLowerCase();
    let marketTypeForBet: string = marketType;

    // Map market outcomes to bet selection format
    if (marketType === 'h2h') {
      if (outcome.name === homeTeam || outcome.name.toLowerCase().includes('home')) {
        selection = 'home';
      } else if (outcome.name === awayTeam || outcome.name.toLowerCase().includes('away')) {
        selection = 'away';
      } else if (outcome.name.toLowerCase().includes('draw')) {
        selection = 'draw';
      }
      marketTypeForBet = 'match_winner';
    } else if (marketType === 'totals' || marketType === 'alternate_totals') {
      // For totals, selection is "over" or "under"
      selection = outcome.name.toLowerCase().startsWith('over') ? 'over' : 
                  outcome.name.toLowerCase().startsWith('under') ? 'under' : 
                  outcome.name.toLowerCase();
      marketTypeForBet = 'totals';
    } else if (marketType === 'btts') {
      // For BTTS, selection is "yes" or "no"
      selection = outcome.name.toLowerCase() === 'yes' ? 'yes' : 
                  outcome.name.toLowerCase() === 'no' ? 'no' : 
                  outcome.name.toLowerCase();
      marketTypeForBet = 'btts';
    } else if (marketType === 'spreads' || marketType === 'alternate_spreads') {
      // For spreads, selection is "home" or "away" with point
      if (outcome.name === homeTeam || outcome.name.toLowerCase().includes('home')) {
        selection = 'home';
      } else if (outcome.name === awayTeam || outcome.name.toLowerCase().includes('away')) {
        selection = 'away';
      } else {
        // Try to infer from name
        selection = outcome.name.toLowerCase();
      }
      marketTypeForBet = 'spreads';
    } else if (marketType === 'draw_no_bet') {
      // Draw no bet: home or away (no draw option)
      if (outcome.name === homeTeam || outcome.name.toLowerCase().includes('home')) {
        selection = 'home';
      } else if (outcome.name === awayTeam || outcome.name.toLowerCase().includes('away')) {
        selection = 'away';
      }
      marketTypeForBet = 'draw_no_bet';
    } else if (marketType === 'double_chance') {
      // Double chance: 1X, 12, X2
      selection = outcome.name.toLowerCase();
      marketTypeForBet = 'double_chance';
    } else {
      // For other markets (player props, etc.), use the outcome name/description
      selection = outcome.description || outcome.name;
      marketTypeForBet = marketType;
    }

    const odds = normalizeToDecimal(outcome.price);
    const line = outcome.line !== undefined ? String(outcome.line) : 
                 outcome.point !== undefined ? String(outcome.point) : 
                 undefined;

    addSelection({
      id: '',
      sportKey,
      league,
      eventId,
      homeTeam,
      awayTeam,
      marketType: marketTypeForBet,
      selection: selection,
      line,
      odds,
      commenceTime,
    });
  };

  const formatOutcomeLabel = (outcome: MatchMarketOutcome): string => {
    if (marketType === 'h2h') {
      if (outcome.name === homeTeam) return homeTeam;
      if (outcome.name === awayTeam) return awayTeam;
      if (outcome.name.toLowerCase().includes('draw')) return 'Draw';
      return outcome.name;
    }

    if (marketType === 'totals' || marketType === 'alternate_totals') {
      const line = outcome.line ?? outcome.point;
      return `${outcome.name} ${line !== undefined ? line : ''}`.trim();
    }

    if (marketType === 'spreads' || marketType === 'alternate_spreads') {
      const line = outcome.line ?? outcome.point;
      let team = outcome.name;
      if (outcome.name === homeTeam || outcome.name.toLowerCase().includes('home')) {
        team = homeTeam;
      } else if (outcome.name === awayTeam || outcome.name.toLowerCase().includes('away')) {
        team = awayTeam;
      }
      return `${team} ${line !== undefined ? (line > 0 ? `+${line}` : `${line}`) : ''}`.trim();
    }

    if (marketType === 'btts') {
      return outcome.name === 'Yes' ? 'Yes' : outcome.name === 'No' ? 'No' : outcome.name;
    }

    // For player props and other markets
    if (outcome.description) {
      return `${outcome.description} - ${outcome.name}`;
    }

    return outcome.name;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        {marketType === 'h2h' ? 'Match Result' :
         marketType === 'totals' ? 'Total Goals' :
         marketType === 'spreads' ? 'Handicap' :
         marketType === 'btts' ? 'Both Teams to Score' :
         marketType === 'draw_no_bet' ? 'Draw No Bet' :
         marketType === 'double_chance' ? 'Double Chance' :
         marketType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </h3>

      {market.outcomes.length === 0 ? (
        <p className="text-sm text-gray-400">No outcomes available for this market.</p>
      ) : (
        <div className={`grid gap-3 ${
          marketType === 'h2h' || marketType === 'draw_no_bet' || marketType === 'double_chance'
            ? 'grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}>
          {market.outcomes.map((outcome, index) => {
            const odds = normalizeToDecimal(outcome.price);
            const line = outcome.line ?? outcome.point;
            return (
              <button
                key={index}
                onClick={() => handleOutcomeClick(outcome)}
                className="bg-gray-700 hover:bg-green-500 text-white p-3 sm:p-4 rounded-lg transition-colors text-left"
              >
                <div className="text-xs sm:text-sm text-gray-300 mb-1">
                  {formatOutcomeLabel(outcome)}
                </div>
                {line !== undefined && (marketType === 'totals' || marketType === 'spreads' || marketType === 'alternate_totals' || marketType === 'alternate_spreads') && (
                  <div className="text-[10px] text-gray-400 mb-1">
                    Line: {line > 0 ? `+${line}` : `${line}`}
                  </div>
                )}
                <div className="font-bold text-base sm:text-lg">{odds.toFixed(2)}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
