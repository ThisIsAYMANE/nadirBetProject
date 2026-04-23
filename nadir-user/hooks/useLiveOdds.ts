'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Match } from '@/types';

interface UseLiveOddsResult {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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

      // --- API-SPORTS FOOTBALL INTEGRATION ---
      if (sportKey === 'football') {
        const response = await fetch('/api/sports/football/live', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result?.success || !result?.data || result.data.length === 0) {
          setMatches([]);
          return;
        }

        // The API-Sports proxy returns pre-transformed Match objects
        setMatches(result.data.slice(0, 50));
        return;
      }
      // ------------------------------------------

      // Fallback for other sports - show empty for now since API-Sports football only
      // TODO: Extend to other sports when API-Sports is configured for them
      setMatches([]);
    } catch (err) {
      console.error('Error fetching live odds:', err);
      setMatches([]);
      setError(
        `Unable to fetch live data: ${err instanceof Error ? err.message : 'Unknown error'
        }. The API may have rate limits or connectivity issues.`
      );
    } finally {
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

