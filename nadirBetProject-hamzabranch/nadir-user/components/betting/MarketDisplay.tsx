'use client';

import React from 'react';
import { Star, BarChart2 } from 'lucide-react';
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
  /** Total number of markets (for dots and "+N" bar). */
  marketCount?: number;
  /** Index of the active market (0-based) for pagination dots. */
  activeMarketIndex?: number;
  /** Called when user taps a pagination dot. */
  onMarketIndexChange?: (index: number) => void;
}

const MARKET_TITLE: Record<string, string> = {
  h2h: 'Match Result',
  totals: 'Total Goals',
  spreads: 'Handicap',
  btts: 'Both Teams to Score',
  draw_no_bet: 'Draw No Bet',
  double_chance: 'Double Chance',
};

export function MarketDisplay({
  market,
  marketType,
  homeTeam,
  awayTeam,
  eventId,
  sportKey,
  league,
  commenceTime,
  marketCount = 0,
  activeMarketIndex = 0,
  onMarketIndexChange,
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

  const isMatchResult = marketType === 'h2h' || marketType === 'draw_no_bet' || marketType === 'double_chance';
  const gridCols = isMatchResult ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3';

  const marketTitle = MARKET_TITLE[marketType] ?? marketType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const formattedTime = commenceTime
    ? new Date(commenceTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date(commenceTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const showDots = marketCount > 1 && onMarketIndexChange;
  const otherMarketsCount = Math.max(0, marketCount - 1);

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 overflow-visible min-w-0">
      {!isMatchResult && (
        <h3 className="text-lg font-bold text-white mb-4">{marketTitle}</h3>
      )}

      {market.outcomes.length === 0 ? (
        <p className="text-sm text-gray-400">No outcomes available for this market.</p>
      ) : isMatchResult && market.outcomes.length <= 3 ? (
        /* Match Result layout: header row, team names left + 3-col grid (label top, odds bottom), dots, bottom bar with star, BB, bar chart, +N */
        <div className="space-y-4">
          {/* Header: date/time left, "Match Result" right */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-gray-400 text-sm truncate" title={formattedTime}>
              {formattedTime}
            </span>
            <span className="text-gray-400 text-sm font-medium shrink-0">{marketTitle}</span>
          </div>

          {/* Body: team names stacked left | 3-column grid (each card: label on top, odds below) */}
          <div className="flex gap-3 min-w-0">
            <div className="flex flex-col justify-center gap-2 shrink-0 text-left min-w-[80px] sm:min-w-[100px]">
              <span className="text-sm text-gray-300 truncate max-w-[100px] sm:max-w-[140px]" title={homeTeam}>
                {homeTeam}
              </span>
              <span className="text-sm text-gray-300 truncate max-w-[100px] sm:max-w-[140px]" title={awayTeam}>
                {awayTeam}
              </span>
            </div>
            <div className={`grid ${gridCols} gap-2 sm:gap-3 flex-1 min-w-0`}>
              {market.outcomes.map((outcome, index) => {
                const odds = normalizeToDecimal(outcome.price);
                const label = formatOutcomeLabel(outcome);
                return (
                  <button
                    key={index}
                    onClick={() => handleOutcomeClick(outcome)}
                    className="bg-gray-700 hover:bg-green-500 text-white p-3 sm:p-4 rounded-lg transition-colors text-center min-w-0 flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-xs sm:text-sm text-gray-300 truncate w-full" title={label}>
                      {label}
                    </span>
                    <span className="font-bold text-base sm:text-lg text-yellow-400">{odds.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pagination dots – keep circular on mobile (items-center + shrink-0 prevent stretch) */}
          {showDots && (
            <div className="flex items-center justify-center gap-1.5 py-2">
              {Array.from({ length: marketCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => onMarketIndexChange(i)}
                  className={`shrink-0 w-2 h-2 min-w-[8px] min-h-[8px] rounded-full transition-colors ${
                    i === activeMarketIndex ? 'bg-white scale-110' : 'bg-gray-500 hover:bg-gray-400'
                  }`}
                  aria-label={`Market ${i + 1} of ${marketCount}`}
                />
              ))}
            </div>
          )}

          {/* Bottom bar: star, BB, bar chart | +N markets */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="flex items-center gap-3 sm:gap-4 text-gray-400">
              <button type="button" className="p-1 hover:text-white transition-colors" aria-label="Add to favorites">
                <Star className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">BB</span>
              <button type="button" className="p-1 hover:text-white transition-colors" aria-label="Statistics">
                <BarChart2 className="w-4 h-4" />
              </button>
            </div>
            {otherMarketsCount > 0 && (
              <span className="text-sm text-gray-400">+{otherMarketsCount}</span>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`grid gap-3 ${gridCols}`}>
            {market.outcomes.map((outcome, index) => {
              const odds = normalizeToDecimal(outcome.price);
              const line = outcome.line ?? outcome.point;
              return (
                <button
                  key={index}
                  onClick={() => handleOutcomeClick(outcome)}
                  className="bg-gray-700 hover:bg-green-500 text-white p-3 sm:p-4 rounded-lg transition-colors text-left min-w-0"
                >
                  <div className="text-xs sm:text-sm text-gray-300 mb-1 truncate">
                    {formatOutcomeLabel(outcome)}
                  </div>
                  {line !== undefined && (marketType === 'totals' || marketType === 'spreads' || marketType === 'alternate_totals' || marketType === 'alternate_spreads') && (
                    <div className="text-[10px] text-gray-400 mb-1">
                      Line: {line > 0 ? `+${line}` : `${line}`}
                    </div>
                  )}
                  <div className="font-bold text-base sm:text-lg text-yellow-400">{odds.toFixed(2)}</div>
                </button>
              );
            })}
          </div>
          {/* Pagination dots + bottom bar for non–Match Result markets */}
          {(showDots || otherMarketsCount > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
              {showDots && (
                <div className="flex items-center justify-center gap-1.5">
                  {Array.from({ length: marketCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => onMarketIndexChange?.(i)}
                      className={`shrink-0 w-2 h-2 min-w-[8px] min-h-[8px] rounded-full transition-colors ${
                        i === activeMarketIndex ? 'bg-white' : 'bg-gray-500 hover:bg-gray-400'
                      }`}
                      aria-label={`Market ${i + 1} of ${marketCount}`}
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 text-gray-400">
                  <button type="button" className="p-1 hover:text-white transition-colors" aria-label="Add to favorites">
                    <Star className="w-4 h-4" />
                  </button>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">BB</span>
                  <button type="button" className="p-1 hover:text-white transition-colors" aria-label="Statistics">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                </div>
                {otherMarketsCount > 0 && <span className="text-sm text-gray-400">+{otherMarketsCount}</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
