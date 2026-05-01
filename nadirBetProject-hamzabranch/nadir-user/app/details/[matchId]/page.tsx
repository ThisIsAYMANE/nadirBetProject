'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Heart, Share2, TrendingUp, Users, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { Match, MatchMarket, MarketType } from '@/types';
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
  const hasFetchedRef = useRef(false);

  const matchParams = useMemo(() => {
    const rawId = (params as { matchId?: string }).matchId;
    const matchId = Array.isArray(rawId) ? rawId[0] : rawId;
    const category = searchParams.get('category');
    const sportKey = searchParams.get('sportKey');
    const dateParam = searchParams.get('date');
    return { matchId, category, sportKey, dateParam };
  }, [params, searchParams]);

  useEffect(() => {
    const { matchId, category, sportKey, dateParam } = matchParams;

    if (!matchId || !category) {
      setError('Match not found. Missing match parameters.');
      setIsLoading(false);
      return;
    }

    // Don't refetch if we already have this match
    if (match && match.id === matchId) {
      setIsLoading(false);
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchMatch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sport = sportKey || category;
        const targetDate = dateParam || new Date().toISOString().split('T')[0];

        // Step 1: Fetch match list for today's date
        const url = `/api/sports/${encodeURIComponent(sport)}?date=${targetDate}`;
        console.log('[MatchDetails] Fetching list from:', url);
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();

        let foundMatch: Match | null = null;

        if (json.success && Array.isArray(json.matches) && json.matches.length > 0) {
          foundMatch = json.matches.find((m: Match) => m.id === matchId) ?? null;
        }

        // Step 2: If not found for today, try without date
        if (!foundMatch) {
          console.log('[MatchDetails] Not found for date, trying without date filter');
          const res2 = await fetch(`/api/sports/${encodeURIComponent(sport)}`, { cache: 'no-store' });
          const json2 = await res2.json();
          if (json2.success && Array.isArray(json2.matches)) {
            foundMatch = json2.matches.find((m: Match) => m.id === matchId) ?? null;
          }
        }

        // Step 3: Build from URL params as guaranteed fallback
        if (!foundMatch) {
          const homeTeam = searchParams.get('home');
          const awayTeam = searchParams.get('away');
          if (homeTeam && awayTeam) {
            const league = searchParams.get('league') ?? sport.toUpperCase();
            const startTime = searchParams.get('startTime') ?? new Date().toISOString();
            const homeOdds = Number(searchParams.get('homeOdds') ?? 1.9);
            const awayOdds = Number(searchParams.get('awayOdds') ?? 2.1);
            const drawOddsRaw = searchParams.get('drawOdds');
            const drawOdds = drawOddsRaw ? Number(drawOddsRaw) : undefined;

            foundMatch = {
              id: matchId!,
              homeTeam,
              awayTeam,
              sport,
              league,
              startTime,
              status: 'upcoming',
              isLive: false,
              odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
              markets: [{
                key: 'h2h',
                outcomes: [
                  { name: homeTeam, price: homeOdds },
                  ...(drawOdds ? [{ name: 'Draw', price: drawOdds }] : []),
                  { name: awayTeam, price: awayOdds },
                ],
              }],
            };
          }
        }

        if (!foundMatch) {
          setError('Match could not be found. It may have been removed or is no longer available.');
          setIsLoading(false);
          return;
        }

        // Step 4: Fetch real odds from the backend and merge markets
        try {
          const oddsRes = await fetch(`/api/sports/${encodeURIComponent(sport)}/odds/${encodeURIComponent(matchId!)}`, { cache: 'no-store' });
          const oddsJson = await oddsRes.json();

          if (oddsJson.success && Array.isArray(oddsJson.markets) && oddsJson.markets.length > 0) {
            console.log(`[MatchDetails] Got ${oddsJson.markets.length} real markets from API`);
            // Merge: real API markets take priority, keep synthetic h2h as fallback if none returned
            foundMatch = { ...foundMatch, markets: oddsJson.markets };
          } else {
            console.log('[MatchDetails] No odds available, using synthetic market');
            // Ensure we always have at least the h2h synthetic market
            if (!foundMatch.markets || foundMatch.markets.length === 0) {
              const h = foundMatch.odds?.home ?? 1.9;
              const a = foundMatch.odds?.away ?? 2.1;
              const d = foundMatch.odds?.draw;
              foundMatch = {
                ...foundMatch,
                markets: [{
                  key: 'h2h',
                  outcomes: [
                    { name: foundMatch.homeTeam, price: h },
                    ...(d ? [{ name: 'Draw', price: d }] : []),
                    { name: foundMatch.awayTeam, price: a },
                  ],
                }]
              };
            }
          }
        } catch (oddsErr) {
          console.warn('[MatchDetails] Odds fetch failed, using existing markets:', oddsErr);
        }

        setMatch(foundMatch);
        setIsLoading(false);
      } catch (err) {
        console.error('[MatchDetails] Error:', err);
        setError('Failed to load match details. Please try again.');
        setIsLoading(false);
      }
    };

    fetchMatch();
  }, [matchParams]);

  // Set default active market when match loads
  useEffect(() => {
    if (match?.markets && match.markets.length > 0 && !activeMarket) {
      const keys = match.markets.map((m) => m.key as MarketType);
      setActiveMarket(keys.includes('h2h') ? 'h2h' : keys[0]);
    }
  }, [match, activeMarket]);

  // ─── Loading ────────────────────────────────────────────────────────────────
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

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (!match || error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚽</div>
              <h2 className="text-white text-xl font-bold mb-2">Match Unavailable</h2>
              <p className="text-gray-400 mb-6">
                {error || 'Match details are not available at the moment.'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 transition-colors"
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

  // ─── Match Detail ────────────────────────────────────────────────────────────
  const availableMarkets: MarketType[] = (match.markets || []).map((m) => m.key as MarketType);
  const currentMarket: MatchMarket | undefined = match.markets?.find((m) => m.key === activeMarket);
  const h2hMarket = match.markets?.find((m) => m.key === 'h2h');

  // Build popular bets from real odds
  const popularBets: { selection: string; odds: number }[] = [];
  if (h2hMarket) {
    const homeOut = h2hMarket.outcomes.find((o) => o.name === match.homeTeam);
    const awayOut = h2hMarket.outcomes.find((o) => o.name === match.awayTeam);
    const drawOut = h2hMarket.outcomes.find((o) => o.name === 'Draw');
    if (homeOut) popularBets.push({ selection: `${match.homeTeam} to Win`, odds: homeOut.price });
    if (drawOut) popularBets.push({ selection: 'Draw', odds: drawOut.price });
    if (awayOut) popularBets.push({ selection: `${match.awayTeam} to Win`, odds: awayOut.price });
  } else {
    // Use top-level odds
    if (match.odds?.home) popularBets.push({ selection: `${match.homeTeam} to Win`, odds: match.odds.home });
    if (match.odds?.draw) popularBets.push({ selection: 'Draw', odds: match.odds.draw });
    if (match.odds?.away) popularBets.push({ selection: `${match.awayTeam} to Win`, odds: match.odds.away });
  }

  const matchDate = new Date(match.startTime);
  const isValidDate = !isNaN(matchDate.getTime());

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex min-w-0">
        <Sidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-6 overflow-x-auto">

          {/* Back */}
          <Link
            href={`/sports/${match.sport}`}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)}</span>
          </Link>

          {/* Match Header */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            {/* League + Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <span className="text-green-400 text-sm font-semibold uppercase tracking-wide">
                {match.league}
              </span>
              <div className="flex items-center gap-2">
                {match.status === 'live' && (
                  <span className="bg-red-500 px-2 py-0.5 rounded text-xs font-bold animate-pulse">LIVE</span>
                )}
                {match.status === 'finished' && (
                  <span className="bg-gray-600 px-2 py-0.5 rounded text-xs font-bold text-gray-300">FINISHED</span>
                )}
                <div className="flex items-center text-gray-400 text-sm gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isValidDate
                      ? matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        + ' ' + matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
                      : 'Date TBC'}
                  </span>
                </div>
                <button className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors" aria-label="Favourite">
                  <Heart className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors" aria-label="Share">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Home */}
              <div className="text-center">
                {match.homeTeamLogo ? (
                  <img
                    src={match.homeTeamLogo}
                    alt={match.homeTeam}
                    className="w-20 h-20 object-contain mx-auto mb-3"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                    {match.homeTeam.charAt(0)}
                  </div>
                )}
                <h2 className="text-white font-bold text-lg leading-tight">{match.homeTeam}</h2>
                {match.odds?.home && (
                  <div className="mt-2 text-green-400 font-semibold text-sm">
                    {formatOddsDisplay(match.odds.home)}
                  </div>
                )}
              </div>

              {/* Score / VS */}
              <div className="text-center">
                {match.status === 'live' || match.status === 'finished' ? (
                  <div className="text-4xl font-bold text-white">
                    <span>{match.homeScore ?? 0}</span>
                    <span className="text-gray-500 mx-2">–</span>
                    <span>{match.awayScore ?? 0}</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-500 text-2xl font-bold mb-1">vs</div>
                    {match.odds?.draw && (
                      <div className="text-xs text-gray-400 mt-2">
                        Draw <span className="text-green-400 font-semibold">{formatOddsDisplay(match.odds.draw)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Away */}
              <div className="text-center">
                {match.awayTeamLogo ? (
                  <img
                    src={match.awayTeamLogo}
                    alt={match.awayTeam}
                    className="w-20 h-20 object-contain mx-auto mb-3"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                    {match.awayTeam.charAt(0)}
                  </div>
                )}
                <h2 className="text-white font-bold text-lg leading-tight">{match.awayTeam}</h2>
                {match.odds?.away && (
                  <div className="mt-2 text-green-400 font-semibold text-sm">
                    {formatOddsDisplay(match.odds.away)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Betting Markets */}
            <div className="lg:col-span-2 space-y-6">

              {availableMarkets.length > 0 && (
                <MarketTabs
                  markets={availableMarkets}
                  activeMarket={activeMarket}
                  onMarketChange={setActiveMarket}
                />
              )}

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
                <div className="bg-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-400">
                    {availableMarkets.length === 0
                      ? 'No betting markets are available for this match yet.'
                      : 'Select a market above to view odds.'}
                  </p>
                </div>
              )}

              {/* Match Info */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Match Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sport</span>
                    <span className="text-white capitalize">{match.sport.replace(/-/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Competition</span>
                    <span className="text-white">{match.league}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span className="text-white">
                      {isValidDate
                        ? matchDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                        : 'TBC'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kick-off</span>
                    <span className="text-white">
                      {isValidDate
                        ? matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'TBC'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold capitalize ${
                      match.status === 'live' ? 'text-red-400' :
                      match.status === 'finished' ? 'text-gray-400' : 'text-green-400'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                  {availableMarkets.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Markets</span>
                      <span className="text-white">{availableMarkets.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Key Bets Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Betting Odds
                </h3>

                {popularBets.length > 0 ? (
                  <div className="space-y-3">
                    {popularBets.map((bet, i) => (
                      <div
                        key={i}
                        className="border border-gray-700 hover:border-green-500/50 rounded-lg p-3 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                            {bet.selection}
                          </span>
                          <span className="text-green-400 font-bold text-lg">
                            {formatOddsDisplay(bet.odds)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Odds will appear here once available.</p>
                )}
              </div>

              {/* Quick info */}
              <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-500">
                <p>📊 Odds sourced via API-Sports. Data may be delayed.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}