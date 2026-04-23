'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Heart, Share2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import type { Match, MatchMarket, MatchMarketOutcome, MarketType } from '@/types';
import { MarketTabs } from '@/components/betting/MarketTabs';
import { MarketDisplay } from '@/components/betting/MarketDisplay';
import { formatOddsDisplay } from '@/lib/oddsUtils';

export default function MatchDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMarket, setActiveMarket] = useState<MarketType | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);
  const isCurrentlyFetchingRef = useRef(false);

  // Memoize the match parameters to prevent unnecessary re-renders
  const matchParams = useMemo(() => {
    const rawId = (params as { matchId?: string }).matchId;
    const matchId = Array.isArray(rawId) ? rawId[0] : rawId;
    const category = searchParams.get('category');
    const sportKey = searchParams.get('sportKey');
    return { matchId, category, sportKey };
  }, [params, searchParams]);

  useEffect(() => {
    const { matchId, category, sportKey } = matchParams;

    if (!matchId || !category || !sportKey) {
      setError('Match details are not available.');
      setIsLoading(false);
      isCurrentlyFetchingRef.current = false;
      return;
    }

    // Create a unique key for this fetch
    const fetchKey = `${matchId}-${category}-${sportKey}`;

    // If we already have data for this exact match, don't refetch
    if (match && match.id === matchId && lastFetchKeyRef.current === fetchKey) {
      setIsLoading(false);
      isCurrentlyFetchingRef.current = false;
      return;
    }

    // If we're already fetching this exact match, don't start another fetch
    if (lastFetchKeyRef.current === fetchKey && isCurrentlyFetchingRef.current) {
      return;
    }

    // Cancel any in-flight request for a different match
    if (abortControllerRef.current && lastFetchKeyRef.current !== fetchKey) {
      abortControllerRef.current.abort();
    }

    // Reset fetching flag for new fetch
    isCurrentlyFetchingRef.current = false;

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchMatch = async () => {
      // Reset state for new match
      setError(null);
      setIsLoading(true);
      lastFetchKeyRef.current = fetchKey;
      isCurrentlyFetchingRef.current = true;

      try {
        console.log('[MatchDetails] Fetching match:', { matchId, category, sportKey });

        const BACKEND_BASE_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

        let matchData: Match | null = null;

        // --- API-SPORTS FOOTBALL INTEGRATION ---
        if (sportKey === 'football') {
          try {
            const fixtureUrl = `${BACKEND_BASE_URL}/api/sports/football/fixtures/${encodeURIComponent(matchId)}`;
            console.log('[MatchDetails] Fetching from:', fixtureUrl);
            
            const smRes = await fetch(
              fixtureUrl,
              {
                cache: 'no-store',
                signal: abortController.signal,
              }
            );

            console.log('[MatchDetails] Response status:', smRes.status);

            if (abortController.signal.aborted) {
              isCurrentlyFetchingRef.current = false;
              setIsLoading(false);
              return;
            }

            if (smRes.ok) {
              const smData = await smRes.json();
              console.log('[MatchDetails] Response:', JSON.stringify(smData).substring(0, 500));
              if (smData.success && smData.matches && smData.matches.length > 0) {
                const fetchedMatch = smData.matches[0];
                matchData = fetchedMatch;
                console.log('[MatchDetails] Found match:', fetchedMatch.homeTeam, 'vs', fetchedMatch.awayTeam);
                console.log('[MatchDetails] Markets:', fetchedMatch.markets?.length || 0);
              } else {
                console.log('[MatchDetails] No match found in response');
              }
            }
          } catch (smErr: any) {
            if (smErr.name === 'AbortError' || abortController.signal.aborted) {
              isCurrentlyFetchingRef.current = false;
              setIsLoading(false);
              return;
            }
            console.warn('API-Sports endpoint failed, falling back:', smErr);
          }
        }
        // ------------------------------------------

        // Use only API-Sports data - no fallback to Odds API
        // If API-Sports returns no markets, match simply has no betting odds available

        // Fallback to sport endpoint if API-Sports failed
        if (!matchData) {
          // Check abort before attempting fallback
          if (abortController.signal.aborted) {
            isCurrentlyFetchingRef.current = false;
            setIsLoading(false);
            return;
          }

          try {
            const sportQuery = new URLSearchParams({
              league: sportKey,
              eventId: matchId,
              markets: 'h2h,totals',
            }).toString();

            const sportRes = await fetch(
              `/api/sports/${encodeURIComponent(category)}?${sportQuery}`,
              {
                cache: 'no-store',
                signal: abortController.signal,
              },
            );

            // Check if request was aborted before processing
            if (abortController.signal.aborted) {
              isCurrentlyFetchingRef.current = false;
              setIsLoading(false);
              return;
            }

            if (!sportRes.ok) {
              throw new Error(`Failed to fetch match details: ${sportRes.statusText}`);
            }

            const sportData = await sportRes.json();

            // Check abort after JSON parsing
            if (abortController.signal.aborted) {
              isCurrentlyFetchingRef.current = false;
              setIsLoading(false);
              return;
            }

            if (
              !sportData.success ||
              !Array.isArray(sportData.matches) ||
              sportData.matches.length === 0
            ) {
              setError('Match not found or no odds available at the moment.');
              setIsLoading(false);
              isCurrentlyFetchingRef.current = false;
              return;
            }

            matchData = sportData.matches[0] as Match;
          } catch (sportErr: any) {
            // Ignore abort errors
            if (sportErr.name === 'AbortError' || abortController.signal.aborted) {
              isCurrentlyFetchingRef.current = false;
              setIsLoading(false);
              return;
            }
            // Re-throw to be caught by outer catch
            throw sportErr;
          }
        }

        // Final check: if we still don't have match data, show error
        if (!matchData) {
          // Always clear loading state, regardless of abort status
          isCurrentlyFetchingRef.current = false;
          setIsLoading(false);

          if (!abortController.signal.aborted) {
            setError('Match not found or no odds available at the moment.');
          }
          return;
        }

        // Only update state if request wasn't aborted
        if (abortController.signal.aborted) {
          isCurrentlyFetchingRef.current = false;
          setIsLoading(false);
          return;
        }

        console.log('[MatchDetails] Match data loaded successfully');
        setMatch(matchData);
        setIsLoading(false);
        isCurrentlyFetchingRef.current = false;
      } catch (err: any) {
        // Always clear fetching state
        isCurrentlyFetchingRef.current = false;

        // Ignore abort errors - don't update state if aborted
        if (err.name === 'AbortError' || abortController.signal.aborted) {
          console.log('[MatchDetails] Request was aborted');
          setIsLoading(false);
          return;
        }

        console.error('[MatchDetails] Error loading match details:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load match details. Please try again.',
        );
        setIsLoading(false);
      }
    };

    fetchMatch();

    // Cleanup: abort request if component unmounts or params change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        isCurrentlyFetchingRef.current = false;
      }
    };
  }, [matchParams]);

  // Set default active market when match data is loaded
  useEffect(() => {
    if (match && match.markets && match.markets.length > 0 && !activeMarket) {
      const markets = match.markets.map((m) => m.key as MarketType);
      setActiveMarket(markets.includes('h2h') ? 'h2h' : markets[0]);
    }
  }, [match, activeMarket]);

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

  // Ensure markets array exists
  if (!match.markets) {
    match.markets = [];
  }

  // Get available market types
  const availableMarkets: MarketType[] = match.markets.map((m) => m.key as MarketType);

  // Get the currently active market data
  const currentMarket: MatchMarket | undefined = match.markets.find(
    (m) => m.key === activeMarket,
  );

  // Derive popular bets for sidebar
  const h2hMarket = match.markets.find((m) => m.key === 'h2h');
  const totalsMarket = match.markets.find((m) => m.key === 'totals');
  const bttsMarket = match.markets.find((m) => m.key === 'btts');

  const popularBets: { selection: string; odds: number }[] = [];

  if (h2hMarket) {
    const homeOutcome = h2hMarket.outcomes.find((o) => o.name === match.homeTeam);
    if (homeOutcome) {
      popularBets.push({ selection: `${match.homeTeam} to Win`, odds: homeOutcome.price });
    }
  }

  if (totalsMarket) {
    const overOutcome = totalsMarket.outcomes.find((o) => o.name.toLowerCase().startsWith('over'));
    if (overOutcome && overOutcome.line !== undefined) {
      popularBets.push({
        selection: `Over ${overOutcome.line} Goals`,
        odds: overOutcome.price,
      });
    }
  }

  if (bttsMarket) {
    const bttsYes = bttsMarket.outcomes.find((o) => o.name.toLowerCase().includes('yes'));
    if (bttsYes) {
      popularBets.push({
        selection: 'Both Teams to Score - Yes',
        odds: bttsYes.price,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex min-w-0">
        <Sidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-6 overflow-x-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Match Header - compact like reference: league left, time right, teams below */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-gray-400 text-sm font-medium">{match.league}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  {new Date(match.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                  {new Date(match.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                {match.status === 'live' && (
                  <span className="bg-red-500 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">LIVE</span>
                )}
                <button
                  className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors shrink-0"
                  aria-label="Add to favorites"
                  title="Add to favorites"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors shrink-0"
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
              {/* Market Tabs */}
              {availableMarkets.length > 0 && (
                <MarketTabs
                  markets={availableMarkets}
                  activeMarket={activeMarket}
                  onMarketChange={setActiveMarket}
                />
              )}

              {/* Active Market Display */}
              {currentMarket && activeMarket ? (
                <MarketDisplay
                  market={currentMarket}
                  marketType={activeMarket}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  eventId={match.id}
                  sportKey={match.sport}
                  league={match.league}
                  commenceTime={match.startTime}
                  marketCount={availableMarkets.length}
                  activeMarketIndex={availableMarkets.indexOf(activeMarket)}
                  onMarketIndexChange={(i) => setActiveMarket(availableMarkets[i] ?? null)}
                />
              ) : (
                <div className="bg-gray-800 rounded-xl p-6">
                  <p className="text-gray-400 text-center">
                    {availableMarkets.length === 0
                      ? 'No betting markets available for this match.'
                      : 'Select a market to view odds.'}
                  </p>
                </div>
              )}

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
                          <span className="text-green-500 font-bold">{formatOddsDisplay(bet.odds)}</span>
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