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
    setBetType,
    removeSelection,
    clearSelections,
    placeBet,
    isPlacing,
  } = useBetting();

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const totalOdds = selections.reduce((acc, sel) => acc * Number(sel.odds || 1), 1);
  const potentialPayout = stake > 0 ? Math.round(stake * totalOdds) : 0;

  const canPlace = selections.length > 0 && stake > 0 && !isPlacing;

  const handlePlaceBet = async () => {
    const result = await placeBet();
    alert(result.message); // simple feedback; can be replaced with toast
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
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

      <div className="flex space-x-2 mb-4">
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

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {selections.length === 0 && (
          <p className="text-xs text-gray-400">
            Select odds from any match to add them to your bet slip.
          </p>
        )}
        {selections.map((sel) => (
          <div
            key={sel.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs space-y-1"
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
                {sel.marketType === 'match_winner' ? 'Match Winner' : sel.marketType}
              </span>
              <span className="font-semibold text-green-400">
                {sel.selection.toUpperCase()} @ {sel.odds.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Stake (points)</span>
          <input
            type="number"
            min={1}
            className="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
            value={stake || ''}
            onChange={(e) => setStake(Number(e.target.value))}
            aria-label="Stake amount"
            placeholder="0"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Potential payout</span>
          <span className="font-semibold text-green-400">{potentialPayout.toLocaleString()} pts</span>
        </div>
        <Button
          disabled={!canPlace}
          onClick={handlePlaceBet}
          className="w-full mt-1 bg-green-500 hover:bg-green-600 text-black font-semibold"
        >
          {isPlacing ? 'Placing bet...' : 'Place Bet'}
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex border-green-500/60 text-green-400 hover:bg-green-500/10"
          >
            Bet Slip ({selections.length})
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md bg-gray-900 text-white border-l border-gray-800">
          <SheetHeader>
            <SheetTitle>Bet Slip</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-full">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile / tablet: bottom drawer
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-16 right-4 z-40 bg-gray-900/90 border-green-500/60 text-green-400 hover:bg-green-500/10 lg:hidden"
        >
          Bet Slip ({selections.length})
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-gray-900 text-white border-t border-gray-800">
        <DrawerHeader>
          <DrawerTitle>Bet Slip</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">{content}</div>
      </DrawerContent>
    </Drawer>
  );
};

