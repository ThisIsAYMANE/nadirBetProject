'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type BetSelection = {
  id: string; // unique key for slip item
  sportKey: string;
  league?: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  marketType: 'match_winner' | 'totals' | 'spreads' | 'btts' | 'draw_no_bet' | 'double_chance' | string;
  selection: 'home' | 'away' | 'draw' | 'over' | 'under' | 'yes' | 'no' | string;
  line?: string;
  odds: number;
  commenceTime?: string;
  bookmakerKey?: string;
  stake?: number; // Individual stake for this selection (used in single bets)
};

type BetType = 'single' | 'accumulator';

interface BettingContextValue {
  betType: BetType;
  selections: BetSelection[];
  stake: number; // Total stake for accumulator bets
  isPlacing: boolean;
  isBetslipOpen: boolean;
  openBetslip: () => void;
  closeBetslip: () => void;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearSelections: () => void;
  setStake: (value: number) => void;
  setSelectionStake: (id: string, stake: number) => void;
  setBetType: (type: BetType) => void;
  placeBet: () => Promise<{ success: boolean; message: string }>;
}

const BettingContext = createContext<BettingContextValue | undefined>(undefined);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [betType, setBetType] = useState<BetType>('single');
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<number>(0);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);

  const openBetslip = useCallback(() => {
    setIsBetslipOpen(true);
  }, []);

  const closeBetslip = useCallback(() => {
    setIsBetslipOpen(false);
  }, []);

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
      const withId = { ...selection, id: `${selection.eventId}-${selection.selection}`, stake: 0 };
      const next = [...prev, withId];
      if (next.length > 1 && betType === 'single') {
        setBetType('accumulator');
      }
      // Auto-open betslip when selection is added
      setIsBetslipOpen(true);
      return next;
    });
  }, [betType]);

  const setSelectionStake = useCallback((id: string, stakeValue: number) => {
    setSelections((prev) =>
      prev.map((sel) => (sel.id === id ? { ...sel, stake: stakeValue } : sel))
    );
  }, []);

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

  const setBetTypeWithReset = useCallback((type: BetType) => {
    setBetType(type);
    // Reset stakes when switching bet types
    if (type === 'single') {
      setStake(0);
      setSelections((prev) => prev.map((sel) => ({ ...sel, stake: 0 })));
    } else {
      setStake(0);
      setSelections((prev) => prev.map((sel) => ({ ...sel, stake: undefined })));
    }
  }, []);

  const placeBet = useCallback(async () => {
    if (!selections.length) {
      return { success: false, message: 'Please select at least one bet.' };
    }

    // Validate stakes based on bet type
    if (betType === 'single') {
      // For single bets, each selection must have its own stake
      const invalidStakes = selections.some((sel) => !sel.stake || sel.stake <= 0);
      if (invalidStakes) {
        return { success: false, message: 'Please enter a stake for each selection.' };
      }
    } else {
      // For accumulator bets, total stake must be set
      if (!stake || stake <= 0) {
        return { success: false, message: 'Please enter a valid stake.' };
      }
    }

    try {
      setIsPlacing(true);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Trigger the global login modal (Header listens for this event)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('openLoginModal'));
        }
        // Return without showing alert - login modal will open
        return { success: false, message: 'LOGIN_REQUIRED' };
      }

      // 1. Verify betslip via checkout endpoint
      const checkoutRes = await fetch('http://localhost:3001/api/betting/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selections }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.valid) {
        // Update context selections with the new odds/status
        if (checkoutData.selections) {
          // map over current selections and update from checkout
          setSelections(prev => prev.map(sel => {
            const updated = checkoutData.selections.find((s: any) => s.id === sel.id);
            if (updated) {
              return { ...sel, odds: updated.currentOdds || sel.odds, status: updated.status };
            }
            return sel;
          }));
        }

        if (checkoutData.oddsChanged) {
          return { success: false, message: 'Odds have changed. Please review your betslip.' };
        }
        return { success: false, message: checkoutData.message || 'One or more selections are no longer available or suspended.' };
      }

      // 2. For single bets, create separate bet requests for each selection
      // For accumulator, send one bet with total stake
      if (betType === 'single') {
        // Place multiple single bets
        const betPromises = selections.map(async (sel) => {
          const body = {
            betType: 'single',
            stake: sel.stake,
            selections: [{
              sportKey: sel.sportKey,
              league: sel.league,
              eventId: sel.eventId,
              homeTeam: sel.homeTeam,
              awayTeam: sel.awayTeam,
              marketType: sel.marketType,
              selection: sel.selection,
              line: sel.line,
              odds: sel.odds,
              commenceTime: sel.commenceTime,
              bookmakerKey: sel.bookmakerKey,
            }],
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
            throw new Error(data.error || `Failed to place bet for ${sel.homeTeam} vs ${sel.awayTeam}`);
          }
          return data;
        });

        const results = await Promise.all(betPromises);
        const totalPayout = results.reduce((sum, r) => sum + (r.potentialPayout || 0), 0);

        clearSelections();
        setIsBetslipOpen(false);
        return {
          success: true,
          message: `${results.length} bet(s) placed successfully. Total potential payout: ${totalPayout.toLocaleString()} pts`,
        };
      } else {
        // Accumulator bet - one bet with total stake
        const body = {
          betType: 'accumulator',
          stake: stake,
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
        setIsBetslipOpen(false);
        return {
          success: true,
          message: `Bet placed successfully. Potential payout: ${data.potentialPayout} pts`,
        };
      }
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
    isBetslipOpen,
    openBetslip,
    closeBetslip,
    addSelection,
    removeSelection,
    clearSelections,
    setStake,
    setSelectionStake,
    setBetType: setBetTypeWithReset,
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

