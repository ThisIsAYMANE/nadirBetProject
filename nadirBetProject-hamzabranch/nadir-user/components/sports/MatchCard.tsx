'use client';
import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import { Match } from '@/types';
import { useBetting } from '@/contexts/BettingContext';
import { formatOddsDisplay } from '@/lib/oddsUtils';

interface MatchCardProps {
  match: Match;
  showLeague?: boolean;
  category?: string; // high-level sport category slug, e.g. "football"
}

export default function MatchCard({ match, showLeague = true, category }: MatchCardProps) {
  const { addSelection } = useBetting();

  /** Safely parse a date string — returns null if unparseable */
  const safeDate = (timeString: string): Date | null => {
    if (!timeString) return null;
    const d = new Date(timeString);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatTime = (timeString: string) => {
    const d = safeDate(timeString);
    if (!d) return '--:--';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (timeString: string) => {
    const d = safeDate(timeString);
    if (!d) return 'TBC';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /** "Feb 1 20:00" style for card header */
  const formatDateTime = (timeString: string) => {
    return `${formatDate(timeString)} ${formatTime(timeString)}`;
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

  // Build a rich href so the details page can always render something
  // even if the API lookup by date misses the match
  const detailsParams = new URLSearchParams();
  if (category) detailsParams.set('category', category);
  if (match.sport) detailsParams.set('sportKey', match.sport);
  detailsParams.set('home', match.homeTeam);
  detailsParams.set('away', match.awayTeam);
  detailsParams.set('league', match.league);
  detailsParams.set('startTime', match.startTime);
  // Safe date parsing — NBA and other sports may return non-ISO date strings
  try {
    const d = new Date(match.startTime);
    if (!isNaN(d.getTime())) {
      detailsParams.set('date', d.toISOString().split('T')[0]);
    }
  } catch (_) { /* skip date param if unparseable */ }
  if (match.odds?.home) detailsParams.set('homeOdds', String(match.odds.home));
  if (match.odds?.away) detailsParams.set('awayOdds', String(match.odds.away));
  if (match.odds?.draw) detailsParams.set('drawOdds', String(match.odds.draw));

  const detailsHref = `/details/${match.id}?${detailsParams.toString()}`;

  return (
    <Link href={detailsHref}>
      <div className="bet-card group flex flex-col min-h-[140px] sm:min-h-[160px]">
        {/* Header: league top-left, date/time + clock top-right */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 min-w-0">
          {showLeague && (
            <span className="text-xs text-gray-400 font-medium truncate">{match.league}</span>
          )}
          <div className="flex items-center gap-1 flex-shrink-0 text-gray-400">
            {match.status === 'live' ? (
              <>
                <Play className="w-3 h-3 text-green-500 fill-current" />
                <span className="text-xs text-green-500 font-semibold">LIVE</span>
                {match.minute != null && (
                  <span className="text-xs text-green-500">{match.minute}'</span>
                )}
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span className="text-xs whitespace-nowrap">{formatDateTime(match.startTime)}</span>
              </>
            )}
          </div>
        </div>

        {/* Main row: team names on the left, outcome buttons (1, X, 2) on the right */}
        <div className="flex flex-1 gap-3 min-w-0 items-stretch">
          {/* Left: teams stacked – wrap so full names show (no truncate) */}
          <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5 min-h-[1.5em]">
              <span className="text-white font-bold text-base sm:text-lg break-words line-clamp-2" title={match.homeTeam}>
                {match.homeTeam}
              </span>
              {match.status === 'live' && match.homeScore !== undefined && (
                <span className="text-base sm:text-lg font-bold text-green-500 flex-shrink-0">{match.homeScore}</span>
              )}
            </div>
            <div className="flex items-center gap-2 min-h-[1.5em]">
              <span className="text-white font-bold text-base sm:text-lg break-words line-clamp-2" title={match.awayTeam}>
                {match.awayTeam}
              </span>
              {match.status === 'live' && match.awayScore !== undefined && (
                <span className="text-base sm:text-lg font-bold text-green-500 flex-shrink-0">{match.awayScore}</span>
              )}
            </div>
          </div>

          {/* Right: outcome buttons 1, X (if draw), 2 (label on top, odds below) */}
          <div className={`grid gap-1.5 sm:gap-2 shrink-0 items-center ${match.odds.draw ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddSelection('home');
              }}
              className="odds-btn flex flex-col items-center justify-center min-h-[48px] sm:min-h-[52px] w-[52px] sm:w-[60px] group-hover:bg-green-500 rounded-lg"
            >
              <span className="text-xs text-gray-300 mb-0.5">1</span>
              <span className="font-bold text-sm sm:text-base text-white leading-tight">{formatOddsDisplay(match.odds.home)}</span>
            </button>
            {match.odds.draw != null && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddSelection('draw');
                }}
                className="odds-btn flex flex-col items-center justify-center min-h-[48px] sm:min-h-[52px] w-[52px] sm:w-[60px] group-hover:bg-green-500 rounded-lg"
              >
                <span className="text-xs text-gray-300 mb-0.5">X</span>
                <span className="font-bold text-sm sm:text-base text-white leading-tight">{formatOddsDisplay(match.odds.draw)}</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddSelection('away');
              }}
              className="odds-btn flex flex-col items-center justify-center min-h-[48px] sm:min-h-[52px] w-[52px] sm:w-[60px] group-hover:bg-green-500 rounded-lg"
            >
              <span className="text-xs text-gray-300 mb-0.5">2</span>
              <span className="font-bold text-sm sm:text-base text-white leading-tight">{formatOddsDisplay(match.odds.away)}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}