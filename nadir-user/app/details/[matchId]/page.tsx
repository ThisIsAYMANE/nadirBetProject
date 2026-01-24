'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Heart, Share2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import type { Match, MatchMarket, MatchMarketOutcome } from '@/types';

export default function MatchDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const rawId = (params as { matchId?: string }).matchId;
        const matchId = Array.isArray(rawId) ? rawId[0] : rawId;
        const category = searchParams.get('category');
        const sportKey = searchParams.get('sportKey'); // underlying Odds API league key, e.g. soccer_epl

        if (!matchId || !category || !sportKey) {
          setError('Match details are not available.');
          setIsLoading(false);
          return;
        }

        const BACKEND_BASE_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

        let matchData: Match | null = null;

        // First, try the event-specific endpoint which supports btts and totals
        try {
          const eventQuery = new URLSearchParams({
            regions: 'eu',
            markets: 'h2h,totals,btts',
            oddsFormat: 'decimal',
          }).toString();

          const eventRes = await fetch(
            `${BACKEND_BASE_URL}/api/betting/event/${encodeURIComponent(matchId)}/odds?${eventQuery}`,
            { cache: 'no-store' },
          );

          if (eventRes.ok) {
            const eventData = await eventRes.json();
            if (eventData && eventData.bookmakers && eventData.bookmakers.length > 0) {
              const { transformToMatch } = await import('@/lib/sportsbookApi');
              matchData = transformToMatch(eventData as any) as Match;
            }
          }
        } catch (eventErr) {
          console.warn('Event endpoint failed, trying sport endpoint:', eventErr);
        }

        // Fallback to sport endpoint if event endpoint failed or returned no data
        if (!matchData) {
          const sportQuery = new URLSearchParams({
            league: sportKey,
            eventId: matchId,
            markets: 'h2h,totals',
          }).toString();

          const sportRes = await fetch(
            `/api/sports/${encodeURIComponent(category)}?${sportQuery}`,
            { cache: 'no-store' },
          );

          if (!sportRes.ok) {
            throw new Error(`Failed to fetch match details: ${sportRes.statusText}`);
          }

          const sportData = await sportRes.json();
          if (
            !sportData.success ||
            !Array.isArray(sportData.matches) ||
            sportData.matches.length === 0
          ) {
            setError('Match not found or no odds available at the moment.');
            setIsLoading(false);
            return;
          }

          matchData = sportData.matches[0] as Match;
        }

        if (!matchData) {
          setError('Match not found or no odds available at the moment.');
          setIsLoading(false);
          return;
        }

        setMatch(matchData);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading match details:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load match details. Please try again.',
        );
        setIsLoading(false);
      }
    };

    fetchMatch();
  }, [params, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading match details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!match || error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                {error || 'Match details are not available at the moment.'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Derive markets for display (match result, totals, BTTS, etc.)
  const normalizeName = (name?: string) => (name || '').toLowerCase();

  // Ensure markets array exists
  if (!match.markets) {
    match.markets = [];
  }

  const h2hMarket: MatchMarket | undefined = match.markets.find(
    (m) => m.key === 'h2h',
  );
  const homeH2H: MatchMarketOutcome | undefined = h2hMarket?.outcomes.find(
    (o) => o.name === match.homeTeam,
  );
  const awayH2H: MatchMarketOutcome | undefined = h2hMarket?.outcomes.find(
    (o) => o.name === match.awayTeam,
  );
  const drawH2H: MatchMarketOutcome | undefined = h2hMarket?.outcomes.find((o) =>
    normalizeName(o.name).includes('draw'),
  );

  const homePrice = homeH2H?.price ?? match.odds.home;
  const awayPrice = awayH2H?.price ?? match.odds.away;
  const drawPrice = drawH2H?.price ?? match.odds.draw;

  const totalsMarket: MatchMarket | undefined =
    match.markets.find((m) => m.key === 'totals') || undefined;
  const overOutcome: MatchMarketOutcome | undefined = totalsMarket?.outcomes.find((o) =>
    normalizeName(o.name).startsWith('over'),
  );
  const underOutcome: MatchMarketOutcome | undefined = totalsMarket?.outcomes.find((o) =>
    normalizeName(o.name).startsWith('under'),
  );
  const totalsLine =
    overOutcome?.line !== undefined
      ? overOutcome.line
      : underOutcome?.line !== undefined
      ? underOutcome.line
      : undefined;
  const hasTotals =
    totalsMarket && overOutcome && underOutcome && typeof totalsLine === 'number';

  const bttsMarket: MatchMarket | undefined =
    match.markets.find(
      (m) => m.key === 'btts' || m.key === 'both_teams_to_score',
    ) || undefined;
  const bttsYes: MatchMarketOutcome | undefined = bttsMarket?.outcomes.find((o) =>
    normalizeName(o.name).includes('yes'),
  );
  const bttsNo: MatchMarketOutcome | undefined = bttsMarket?.outcomes.find((o) =>
    normalizeName(o.name).includes('no'),
  );
  const hasBtts = bttsMarket && bttsYes && bttsNo;

  const popularBets: { selection: string; odds: number }[] = [];
  if (homePrice) {
    popularBets.push({ selection: `${match.homeTeam} to Win`, odds: homePrice });
  }
  if (typeof totalsLine === 'number' && overOutcome) {
    popularBets.push({
      selection: `Over ${totalsLine} Goals`,
      odds: overOutcome.price,
    });
  }
  if (bttsYes) {
    popularBets.push({
      selection: 'Both Teams to Score - Yes',
      odds: bttsYes.price,
    });
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex overflow-x-hidden">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          {/* Back Button */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Match Header */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                <span className="bg-blue-500 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  {match.league}
                </span>
                {match.status === 'live' && (
                  <span className="bg-red-500 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  aria-label="Add to favorites"
                  title="Add to favorites"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  aria-label="Share match"
                  title="Share match"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Home Team */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {match.homeTeam.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{match.homeTeam}</h2>
                {match.status === 'live' && match.homeScore !== undefined && (
                  <div className="text-3xl font-bold text-green-500 mt-2">
                    {match.homeScore}
                  </div>
                )}
              </div>

              {/* Match Info */}
              <div className="text-center">
                {match.status === 'live' ? (
                  <div>
                    <div className="text-lg text-green-500 font-semibold mb-2">LIVE</div>
                    {match.minute && (
                      <div className="text-3xl font-bold text-white">{match.minute}'</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 mb-2">
                      {new Date(match.startTime).toLocaleDateString()}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {new Date(match.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {match.awayTeam.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{match.awayTeam}</h2>
                {match.status === 'live' && match.awayScore !== undefined && (
                  <div className="text-3xl font-bold text-green-500 mt-2">
                    {match.awayScore}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Betting Markets */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Markets */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Main Markets</h3>
                
                <div className="space-y-4">
                  {/* Match Result */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Match Result</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">{match.homeTeam}</div>
                        <div className="font-bold">{homePrice}</div>
                      </button>
                      {drawPrice && (
                        <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                          <div className="text-sm text-gray-300 mb-1">Draw</div>
                          <div className="font-bold">{drawPrice}</div>
                        </button>
                      )}
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">{match.awayTeam}</div>
                        <div className="font-bold">{awayPrice}</div>
                      </button>
                    </div>
                  </div>

                  {/* Over/Under */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Total Goals</h4>
                    {hasTotals ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                          <div className="text-sm text-gray-300 mb-1">
                            Over {totalsLine}
                          </div>
                          <div className="font-bold">{overOutcome?.price}</div>
                        </button>
                        <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                          <div className="text-sm text-gray-300 mb-1">
                            Under {totalsLine}
                          </div>
                          <div className="font-bold">{underOutcome?.price}</div>
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Total goals market is not available for this match.
                      </p>
                    )}
                  </div>

                  {/* Both Teams to Score */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Both Teams to Score</h4>
                    {hasBtts ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                          <div className="text-sm text-gray-300 mb-1">Yes</div>
                          <div className="font-bold">{bttsYes?.price}</div>
                        </button>
                        <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                          <div className="text-sm text-gray-300 mb-1">No</div>
                          <div className="font-bold">{bttsNo?.price}</div>
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Both Teams to Score market is not available for this match.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Match Statistics</span>
                </h3>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kick-off</span>
                    <span className="text-white">
                      {new Date(match.startTime).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                  </div>
                  {match.primaryBookmaker && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Odds source</span>
                      <span className="text-white">{match.primaryBookmaker}</span>
                    </div>
                  )}
                  {match.lastUpdate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Odds last updated</span>
                      <span className="text-white">
                        {new Date(match.lastUpdate).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                  )}
                  {match.markets && match.markets.length > 0 && (
                    <div>
                      <span className="text-gray-400 block mb-1">
                        Markets available from this bookmaker
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {match.markets.map((m) => (
                          <span
                            key={m.key}
                            className="inline-flex items-center px-2 py-1 rounded-full bg-gray-700 text-xs text-gray-200"
                          >
                            {m.key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    In-play statistics such as possession and shots are not provided by the odds
                    API, so they are not displayed here.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Markets (derived from real odds) */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Key Markets</span>
                </h3>
                
                {popularBets.length > 0 ? (
                  <div className="space-y-3">
                    {popularBets.map((bet, index) => (
                      <div key={index} className="border border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">{bet.selection}</span>
                          <span className="text-green-500 font-bold">{bet.odds}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Key betting markets for this match are currently unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}