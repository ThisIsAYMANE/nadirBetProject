'use client';
import { useState, useEffect } from 'react';
import { Match } from '@/types';

interface UseSportsDataResult {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSportsData(sportKey: string, selectedLeague: string = 'all', date?: string): UseSportsDataResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      // Only pass league if it's a numeric ID — API-Sports doesn't accept sport-name slugs
      if (selectedLeague && selectedLeague !== 'all' && /^\d+$/.test(selectedLeague)) {
        params.set('league', selectedLeague);
      }
      if (date) params.set('date', date);
      const queryString = params.size > 0 ? `?${params.toString()}` : '';

      const response = await fetch(`/api/sports/${sportKey}${queryString}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMatches(data.matches || []);
      } else {
        throw new Error(data.error || 'Failed to fetch matches');
      }
    } catch (err) {
      console.error('Error fetching sports data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportKey, selectedLeague, date]);

  return {
    matches,
    isLoading,
    error,
    refetch: fetchData
  };
}

