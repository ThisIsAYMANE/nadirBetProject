'use client';
import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import { Match } from '@/types';
import { useBetting } from '@/contexts/BettingContext';

interface MatchCardProps {
  match: Match;
  showLeague?: boolean;
  category?: string; // high-level sport category slug, e.g. "football"
}

export default function MatchCard({ match, showLeague = true, category }: MatchCardProps) {
  const { addSelection } = useBetting();

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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

  const detailsHref =
    category && match.sport
      ? `/details/${match.id}?category=${encodeURIComponent(
          category,
        )}&sportKey=${encodeURIComponent(match.sport)}`
      : `/details/${match.id}`;

  return (
    <Link href={detailsHref}>
      <div className="bet-card group">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          {showLeague && (
            <span className="text-xs text-gray-400 font-medium truncate mr-2">{match.league}</span>
          )}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {match.status === 'live' && (
              <div className="flex items-center space-x-1">
                <Play className="w-3 h-3 text-green-500 fill-current" />
                <span className="text-xs text-green-500 font-semibold">LIVE</span>
                {match.minute && (
                  <span className="text-xs text-green-500">{match.minute}'</span>
                )}
              </div>
            )}
            {match.status === 'upcoming' && (
              <div className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-xs whitespace-nowrap">{formatDate(match.startTime)} {formatTime(match.startTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm sm:text-base truncate mr-2">{match.homeTeam}</span>
              {match.status === 'live' && match.homeScore !== undefined && (
                <span className="text-base sm:text-lg font-bold text-green-500 flex-shrink-0">{match.homeScore}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm sm:text-base truncate mr-2">{match.awayTeam}</span>
              {match.status === 'live' && match.awayScore !== undefined && (
                <span className="text-base sm:text-lg font-bold text-green-500 flex-shrink-0">{match.awayScore}</span>
              )}
            </div>
          </div>
        </div>

        {/* Odds */}
        <div className="flex items-center justify-between space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAddSelection('home');
            }}
            className="odds-btn flex-1 group-hover:bg-green-500 min-h-[44px] sm:min-h-[50px]"
          >
            <div className="text-xs text-gray-300 mb-0.5 sm:mb-1">1</div>
            <div className="font-bold text-sm sm:text-base">{match.odds.home}</div>
          </button>
          
          {match.odds.draw && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddSelection('draw');
              }}
              className="odds-btn flex-1 group-hover:bg-green-500 min-h-[44px] sm:min-h-[50px]"
            >
              <div className="text-xs text-gray-300 mb-0.5 sm:mb-1">X</div>
              <div className="font-bold text-sm sm:text-base">{match.odds.draw}</div>
            </button>
          )}
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAddSelection('away');
            }}
            className="odds-btn flex-1 group-hover:bg-green-500 min-h-[44px] sm:min-h-[50px]"
          >
            <div className="text-xs text-gray-300 mb-0.5 sm:mb-1">2</div>
            <div className="font-bold text-sm sm:text-base">{match.odds.away}</div>
          </button>
        </div>
      </div>
    </Link>
  );
}