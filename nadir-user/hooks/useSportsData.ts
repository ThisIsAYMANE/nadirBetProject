'use client';
import { useState, useEffect } from 'react';
import { Match } from '@/types';

interface UseSportsDataResult {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSportsData(sportKey: string, selectedLeague: string = 'all'): UseSportsDataResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const leagueParam = selectedLeague !== 'all' ? `?league=${selectedLeague}` : '';
      const response = await fetch(`/api/sports/${sportKey}${leagueParam}`, {
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
    } catch (err: any) {
      console.error('Error fetching sports data:', err);
      setError(err.message || 'Failed to load data');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sportKey, selectedLeague]);

  return {
    matches,
    isLoading,
    error,
    refetch: fetchData
  };
}

