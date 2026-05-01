'use client';
import Link from 'next/link';
import { Clock, Play, BarChart3 } from 'lucide-react';
import { Match } from '@/types';
import { useBetting } from '@/contexts/BettingContext';
import { formatOddsDisplay } from '@/lib/oddsUtils';

// Map sport key prefix to category (same logic as sportsbookApi.ts)
const PREFIX_CATEGORY_MAP: Record<string, string> = {
  soccer: 'football',
  americanfootball: 'american-football',
  basketball: 'basketball',
  tennis: 'tennis',
  icehockey: 'ice-hockey',
  cricket: 'cricket',
  rugbyunion: 'rugby',
  rugbyleague: 'rugby',
  baseball: 'baseball',
  mma: 'mma',
  boxing: 'boxing',
  handball: 'handball',
  table_tennis: 'table-tennis',
};

function getCategoryFromSport(sportKey: string): string {
  const prefix = sportKey.split('_')[0];
  return PREFIX_CATEGORY_MAP[prefix] || 'sports';
}

interface MatchListRowProps {
  match: Match;
  category?: string; // high-level sport category slug, e.g. "football"
}

export default function MatchListRow({ match, category }: MatchListRowProps) {
  const { addSelection } = useBetting();
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const time = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    if (date.toDateString() === today.toDateString()) {
      return time;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Dem. ${time}`;
    } else {
      const dayNames = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
      const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${time}`;
    }
  };

  const handleAddSelection = (selection: 'home' | 'away' | 'draw') => {
    const odds =
      selection === 'home'
        ? match.odds.home
        : selection === 'away'
        ? match.odds.away
        : match.odds.draw || 0;

    addSelection({
      id: '',
      sportKey: match.sport || 'unknown',
      league: match.league,
      eventId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      marketType: 'match_winner',
      selection,
      odds,
      commenceTime: match.startTime,
    });
  };

  // Build the details URL with required query parameters
  const detailsHref =
    match.sport
      ? `/details/${match.id}?category=${encodeURIComponent(
          category || getCategoryFromSport(match.sport)
        )}&sportKey=${encodeURIComponent(match.sport)}`
      : `/details/${match.id}`;

  return (
    <Link href={detailsHref}>
      <div className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors group last:border-b-0">
        <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 gap-3 sm:gap-4">
          {/* Time Column - Fixed Width */}
          <div className="flex-shrink-0 w-20 sm:w-24">
            {match.status === 'live' ? (
              <div className="flex flex-col">
                <div className="flex items-center space-x-1 mb-0.5">
                  <Play className="w-3 h-3 text-green-500 fill-current" />
                  <span className="text-xs text-green-500 font-semibold">LIVE</span>
                </div>
                {match.minute && (
                  <span className="text-xs text-green-500">{match.minute}'</span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-300">{formatTime(match.startTime)}</span>
              </div>
            )}
          </div>

          {/* Teams Column - Flexible */}
          <div className="flex-1 min-w-0 flex items-center space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 bg-gray-700 rounded flex items-center justify-center">
                  {match.homeTeamLogo ? (
                    <span className="text-xs">🏴</span>
                  ) : (
                    <span className="text-xs">⚽</span>
                  )}
                </div>
                <span className="text-white text-sm sm:text-base font-medium truncate">
                  {match.homeTeam}
                </span>
                {match.status === 'live' && match.homeScore !== undefined && (
                  <span className="text-green-500 font-bold text-sm sm:text-base ml-auto flex-shrink-0">
                    {match.homeScore}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 bg-gray-700 rounded flex items-center justify-center">
                  {match.awayTeamLogo ? (
                    <span className="text-xs">🏴</span>
                  ) : (
                    <span className="text-xs">⚽</span>
                  )}
                </div>
                <span className="text-white text-sm sm:text-base font-medium truncate">
                  {match.awayTeam}
                </span>
                {match.status === 'live' && match.awayScore !== undefined && (
                  <span className="text-green-500 font-bold text-sm sm:text-base ml-auto flex-shrink-0">
                    {match.awayScore}
                  </span>
                )}
              </div>
            </div>

            {/* Additional Info Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  // Handle more options
                }}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1 rounded text-xs font-semibold border border-green-500/30 transition-colors"
              >
                6»
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  // Handle stats
                }}
                className="text-gray-400 hover:text-gray-300 p-1.5 rounded transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Odds Columns - Fixed Width */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddSelection('home');
              }}
              className="bg-gray-700 hover:bg-green-500 text-white px-3 sm:px-4 py-2.5 rounded font-semibold text-sm sm:text-base min-w-[55px] sm:min-w-[65px] text-center transition-colors"
            >
              <div className="text-xs text-gray-300 mb-0.5">1</div>
              <div className="font-bold text-yellow-400">{formatOddsDisplay(match.odds.home)}</div>
            </button>
            
            {match.odds.draw && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddSelection('draw');
                }}
                className="bg-gray-700 hover:bg-green-500 text-white px-3 sm:px-4 py-2.5 rounded font-semibold text-sm sm:text-base min-w-[55px] sm:min-w-[65px] text-center transition-colors"
                aria-label="Bet on draw (X)"
                title="Bet on draw"
              >
              <div className="text-xs text-gray-300 mb-0.5" aria-hidden="true">
                X
              </div>
                <div className="font-bold text-yellow-400">{formatOddsDisplay(match.odds.draw)}</div>
              </button>
            )}
            
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddSelection('away');
              }}
              className="bg-gray-700 hover:bg-green-500 text-white px-3 sm:px-4 py-2.5 rounded font-semibold text-sm sm:text-base min-w-[55px] sm:min-w-[65px] text-center transition-colors"
            >
              <div className="text-xs text-gray-300 mb-0.5">2</div>
              <div className="font-bold text-yellow-400">{formatOddsDisplay(match.odds.away)}</div>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

