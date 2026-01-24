'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type BetSelection = {
  id: string; // unique key for slip item
  sportKey: string;
  league?: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  marketType: 'match_winner';
  selection: 'home' | 'away' | 'draw';
  line?: string;
  odds: number;
  commenceTime?: string;
  bookmakerKey?: string;
};

type BetType = 'single' | 'accumulator';

interface BettingContextValue {
  betType: BetType;
  selections: BetSelection[];
  stake: number;
  isPlacing: boolean;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearSelections: () => void;
  setStake: (value: number) => void;
  setBetType: (type: BetType) => void;
  placeBet: () => Promise<{ success: boolean; message: string }>;
}

const BettingContext = createContext<BettingContextValue | undefined>(undefined);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [betType, setBetType] = useState<BetType>('single');
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<number>(0);
  const [isPlacing, setIsPlacing] = useState(false);

  const addSelection = useCallback((selection: BetSelection) => {
    setSelections((prev) => {
      // For now, prevent duplicate selection on same event + side
      const exists = prev.find(
        (s) =>
          s.eventId === selection.eventId &&
          s.marketType === selection.marketType &&
          s.selection === selection.selection
      );
      if (exists) {
        return prev;
      }
      const withId = { ...selection, id: `${selection.eventId}-${selection.selection}` };
      const next = [...prev, withId];
      if (next.length > 1 && betType === 'single') {
        setBetType('accumulator');
      }
      return next;
    });
  }, [betType]);

  const removeSelection = useCallback((id: string) => {
    setSelections((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length <= 1) {
        setBetType('single');
      }
      return next;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelections([]);
    setBetType('single');
    setStake(0);
  }, []);

  const placeBet = useCallback(async () => {
    if (!selections.length) {
      return { success: false, message: 'Please select at least one bet.' };
    }
    if (!stake || stake <= 0) {
      return { success: false, message: 'Please enter a valid stake.' };
    }

    try {
      setIsPlacing(true);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Trigger the global login modal (Header listens for this event)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('openLoginModal'));
        }
        return { success: false, message: 'You must be logged in to place a bet.' };
      }

      const body = {
        betType,
        stake,
        selections: selections.map((s) => ({
          sportKey: s.sportKey,
          league: s.league,
          eventId: s.eventId,
          homeTeam: s.homeTeam,
          awayTeam: s.awayTeam,
          marketType: s.marketType,
          selection: s.selection,
          line: s.line,
          odds: s.odds,
          commenceTime: s.commenceTime,
          bookmakerKey: s.bookmakerKey,
        })),
      };

      const res = await fetch('http://localhost:3001/api/betting/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Failed to place bet.' };
      }

      clearSelections();
      return {
        success: true,
        message: `Bet placed successfully. Potential payout: ${data.potentialPayout} pts`,
      };
    } catch (err: any) {
      console.error('Error placing bet:', err);
      return { success: false, message: 'Unexpected error placing bet.' };
    } finally {
      setIsPlacing(false);
    }
  }, [betType, selections, stake, clearSelections]);

  const value: BettingContextValue = {
    betType,
    selections,
    stake,
    isPlacing,
    addSelection,
    removeSelection,
    clearSelections,
    setStake,
    setBetType,
    placeBet,
  };

  return <BettingContext.Provider value={value}>{children}</BettingContext.Provider>;
};

export const useBetting = () => {
  const ctx = useContext(BettingContext);
  if (!ctx) {
    throw new Error('useBetting must be used within a BettingProvider');
  }
  return ctx;
};

