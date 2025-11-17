'use client';
import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import { Match } from '@/types';

interface MatchCardProps {
  match: Match;
  showLeague?: boolean;
}

export default function MatchCard({ match, showLeague = true }: MatchCardProps) {
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

  return (
    <Link href={`/details/${match.id}`}>
      <div className="bet-card group">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          {showLeague && (
            <span className="text-xs text-gray-400 font-medium">{match.league}</span>
          )}
          <div className="flex items-center space-x-2">
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
                <span className="text-xs">{formatDate(match.startTime)} {formatTime(match.startTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{match.homeTeam}</span>
              {match.status === 'live' && match.homeScore !== undefined && (
                <span className="text-lg font-bold text-green-500">{match.homeScore}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{match.awayTeam}</span>
              {match.status === 'live' && match.awayScore !== undefined && (
                <span className="text-lg font-bold text-green-500">{match.awayScore}</span>
              )}
            </div>
          </div>
        </div>

        {/* Odds */}
        <div className="flex items-center justify-between space-x-2">
          <button className="odds-btn flex-1 group-hover:bg-green-500">
            <div className="text-xs text-gray-300 mb-1">1</div>
            <div className="font-bold">{match.odds.home}</div>
          </button>
          
          {match.odds.draw && (
            <button className="odds-btn flex-1 group-hover:bg-green-500">
              <div className="text-xs text-gray-300 mb-1">X</div>
              <div className="font-bold">{match.odds.draw}</div>
            </button>
          )}
          
          <button className="odds-btn flex-1 group-hover:bg-green-500">
            <div className="text-xs text-gray-300 mb-1">2</div>
            <div className="font-bold">{match.odds.away}</div>
          </button>
        </div>
      </div>
    </Link>
  );
}