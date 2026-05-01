'use client';

import React from 'react';
import { useBetting } from '@/contexts/BettingContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Trash2 } from 'lucide-react';

export const BettingSlip: React.FC = () => {
  const {
    betType,
    selections,
    stake,
    setStake,
    setSelectionStake,
    setBetType,
    removeSelection,
    clearSelections,
    placeBet,
    isPlacing,
    isBetslipOpen,
    openBetslip,
    closeBetslip,
  } = useBetting();

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Calculate potential payout based on bet type
  const calculatePotentialPayout = () => {
    if (betType === 'single') {
      // For single bets, sum up individual payouts
      return selections.reduce((total, sel) => {
        const selStake = sel.stake || 0;
        return total + Math.round(selStake * Number(sel.odds || 1));
      }, 0);
    } else {
      // For accumulator, multiply all odds and multiply by total stake
      const totalOdds = selections.reduce((acc, sel) => acc * Number(sel.odds || 1), 1);
      return stake > 0 ? Math.round(stake * totalOdds) : 0;
    }
  };

  const potentialPayout = calculatePotentialPayout();

  // Check if bet can be placed
  const canPlace = () => {
    if (selections.length === 0 || isPlacing) return false;
    
    if (betType === 'single') {
      // All selections must have a stake > 0
      return selections.every((sel) => sel.stake && sel.stake > 0);
    } else {
      // Total stake must be > 0
      return stake > 0;
    }
  };

  const handlePlaceBet = async () => {
    const result = await placeBet();
    // Only show alert for actual errors, not for login requirement (login modal already opens)
    if (!result.success && result.message !== 'LOGIN_REQUIRED') {
      alert(result.message);
    }
    // If bet was successful, the betslip will auto-close and selections will be cleared
  };

  const content = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Bet Slip</p>
          <p className="text-sm text-gray-300">{selections.length} selection(s)</p>
        </div>
        {selections.length > 0 && (
          <button
            onClick={clearSelections}
            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="flex space-x-2 mb-4 flex-shrink-0">
        <button
          onClick={() => setBetType('single')}
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
            betType === 'single'
              ? 'bg-green-500 text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Single
        </button>
        <button
          onClick={() => setBetType('accumulator')}
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
            betType === 'accumulator'
              ? 'bg-green-500 text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Combo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {selections.length === 0 && (
          <p className="text-xs text-gray-400">
            Select odds from any match to add them to your bet slip.
          </p>
        )}
        {selections.map((sel) => {
          const selectionPayout = betType === 'single' && sel.stake 
            ? Math.round((sel.stake || 0) * Number(sel.odds || 1))
            : 0;
          
          return (
            <div
              key={sel.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-semibold">
                  {sel.homeTeam} vs {sel.awayTeam}
                </span>
                <button
                  onClick={() => removeSelection(sel.id)}
                  className="text-gray-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="uppercase">
                  {sel.marketType === 'match_winner' ? 'Match Winner' : 
                   sel.marketType === 'totals' ? 'Totals' :
                   sel.marketType === 'spreads' ? 'Handicap' :
                   sel.marketType === 'btts' ? 'BTTS' :
                   sel.marketType === 'draw_no_bet' ? 'Draw No Bet' :
                   sel.marketType === 'double_chance' ? 'Double Chance' :
                   sel.marketType.replace(/_/g, ' ')}
                </span>
                <span className="font-semibold text-green-400">
                  {sel.selection.toUpperCase()}{sel.line ? ` (${sel.line})` : ''} @ {sel.odds.toFixed(2)}
                </span>
              </div>
              {betType === 'single' && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="text-[11px] text-gray-400">Stake</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                      value={sel.stake || ''}
                      onChange={(e) => setSelectionStake(sel.id, Number(e.target.value))}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-gray-500">
                      → {selectionPayout.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-800 pt-3 space-y-3 flex-shrink-0 pb-4">
        {betType === 'accumulator' && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Total Stake (points)</span>
            <input
              type="number"
              min={1}
              className="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              value={stake || ''}
              onChange={(e) => setStake(Number(e.target.value))}
              aria-label="Total stake amount"
              placeholder="0"
            />
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Total Potential Payout</span>
          <span className="font-semibold text-green-400">{potentialPayout.toLocaleString()} pts</span>
        </div>
        {betType === 'single' && selections.length > 0 && (
          <div className="text-[10px] text-gray-400 text-center">
            {selections.filter(s => s.stake && s.stake > 0).length} of {selections.length} selections with stake
          </div>
        )}
        <Button
          disabled={!canPlace()}
          onClick={handlePlaceBet}
          className="w-full mt-1 bg-green-500 hover:bg-green-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlacing ? 'Placing bet...' : betType === 'single' ? 'Place Bets' : 'Place Bet'}
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={isBetslipOpen} onOpenChange={(open) => open ? openBetslip() : closeBetslip()}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-gray-900 text-white border-l border-gray-800 flex flex-col p-0 h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-800 flex-shrink-0">
            <SheetTitle>Bet Slip</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col px-6 pt-4 min-h-0">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile / tablet: bottom drawer
  return (
    <Drawer open={isBetslipOpen} onOpenChange={(open) => open ? openBetslip() : closeBetslip()}>
      <DrawerContent className="bg-gray-900 text-white border-t border-gray-800 flex flex-col max-h-[90vh] h-auto">
        <DrawerHeader className="px-4 pt-4 pb-3 border-b border-gray-800 flex-shrink-0">
          <DrawerTitle>Bet Slip</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden flex flex-col px-4 py-4 min-h-0">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

