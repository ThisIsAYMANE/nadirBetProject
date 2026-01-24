'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Match } from '@/types';

interface UseLiveOddsResult {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper to map our high-level sport keys to keywords
// used to filter the arbitrage API response.
function getSportKeywords(sportKey: string): string[] {
  const sportMap: Record<string, string[]> = {
    // "football" in our routes == soccer only. Avoid using the
    // generic "football" keyword here, otherwise American Football
    // competitions (whose sport string contains "American Football")
    // will also match the soccer page.
    football: ['soccer'],
    basketball: ['basketball'],
    'american-football': ['american_football', 'americanfootball', 'nfl'],
    tennis: ['tennis'],
    baseball: ['baseball'],
    'ice-hockey': ['hockey', 'ice_hockey', 'icehockey'],
    boxing: ['boxing'],
    mma: ['mma', 'mixed_martial_arts'],
    cricket: ['cricket'],
    rugby: ['rugby'],
    handball: ['handball'],
    futsal: ['futsal'],
    'table-tennis': ['table_tennis', 'tabletennis', 'ping_pong'],
  };

  return sportMap[sportKey] || [sportKey];
}

/**
 * Live odds hook built on top of the existing `/api/arbitrage`
 * route. It polls the API periodically and maps results to the
 * shared `Match` interface used by the sports components.
 */
export function useLiveOdds(sportKey: string, intervalMs = 30000): UseLiveOddsResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveOdds = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/arbitrage?type=ARBITRAGE', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result?.success || !result?.data) {
        // Treat this as \"no data\" rather than a hard error,
        // so the UI can show a neutral empty state.
        setMatches([]);
        return;
      }

      const advantages = result.data.advantages || [];

      if (!Array.isArray(advantages) || advantages.length === 0) {
        // No arbitrage opportunities at the moment.
        setMatches([]);
        return;
      }

      // Filter by sport if a specific sport is requested.
      // When sportKey === 'all', we keep everything.
      let filtered = advantages;
      if (sportKey && sportKey !== 'all') {
        const sportKeywords = getSportKeywords(sportKey);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = advantages.filter((advantage: any) => {
          const sport =
            advantage.market?.event?.competitionInstance?.competition?.sport?.toLowerCase() || '';
          const competitionName =
            advantage.market?.event?.competitionInstance?.competition?.name?.toLowerCase() || '';
          const eventName = advantage.market?.event?.name?.toLowerCase() || '';

          return sportKeywords.some((keyword) =>
            [sport, competitionName, eventName].some((field) => field.includes(keyword))
          );
        });
      }

      if (filtered.length === 0) {
        // No opportunities for this specific sport; show neutral
        // empty state instead of an error banner.
        setMatches([]);
        return;
      }

      // Map API arbitrage entries to our `Match` interface.
      const mapped: Match[] = filtered
        .slice(0, 50)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((advantage: any, index: number) => {
          const event = advantage.market?.event;
          const participants = event?.participants || [];
          const outcomes = advantage.outcomes || [];

          const homeTeam = participants[0]?.name || participants[0]?.shortName || 'Team A';
          const awayTeam = participants[1]?.name || participants[1]?.shortName || 'Team B';

          const homeOdds = outcomes[0]?.payout || 2.0;
          const awayOdds = outcomes[1]?.payout || 2.0;
          const drawOdds = outcomes[2]?.payout as number | undefined;

          const rawSport = event?.competitionInstance?.competition?.sport || sportKey || 'football';
          const leagueName =
            event?.competitionInstance?.competition?.name ||
            event?.competitionInstance?.name ||
            'Live Betting';

          return {
            id: advantage.key || `match-${index}`,
            homeTeam,
            awayTeam,
            sport: rawSport,
            league: leagueName,
            startTime: event?.startTime || new Date().toISOString(),
            status: (outcomes[0]?.live ? 'live' : 'upcoming') as Match['status'],
            odds: {
              home: homeOdds,
              away: awayOdds,
              draw: drawOdds,
            },
          };
        });

      setMatches(mapped);
    } catch (err) {
      console.error('Error fetching live odds:', err);
      setMatches([]);
      setError(
        `Unable to fetch live data: ${
          err instanceof Error ? err.message : 'Unknown error'
        }. The API may have rate limits or connectivity issues.`
      );
    } finally {
      // Only ever turn loading off; we don't toggle it back on for
      // subsequent refreshes so the UI does not flicker.
      setIsLoading(false);
    }
  }, [sportKey]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchLiveOdds();
  }, [fetchLiveOdds]);

  // Polling for live updates
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;

    const id = setInterval(() => {
      fetchLiveOdds();
    }, intervalMs);

    return () => clearInterval(id);
  }, [fetchLiveOdds, intervalMs]);

  return {
    matches,
    isLoading,
    error,
    refetch: fetchLiveOdds,
  };
}

