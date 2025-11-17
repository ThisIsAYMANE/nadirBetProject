'use client';
import { Play, Star, Crown } from 'lucide-react';
import { CasinoGame } from '@/types';

interface GameCardProps {
  game: CasinoGame;
}

export default function GameCard({ game }: GameCardProps) {
  const formatJackpot = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="casino-game-card group">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
        {/* Game Icon/Name Display */}
        <div className="text-center p-2 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{game.name.charAt(0)}</div>
          <div className="text-xs text-gray-300 uppercase tracking-wider">{game.category}</div>
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
          <button className="bg-green-500 text-black px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-semibold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2 text-sm sm:text-base">
            <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
            <span className="hidden sm:inline">Play Now</span>
            <span className="sm:hidden">Play</span>
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col space-y-1">
          {game.isNew && (
            <span className="bg-green-500 text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-bold">NEW</span>
          )}
          {game.isLive && (
            <span className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-bold">LIVE</span>
          )}
        </div>

        {/* Jackpot */}
        {game.jackpot && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-yellow-500 text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center space-x-1">
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-xs font-bold">{formatJackpot(game.jackpot)}</span>
          </div>
        )}

        {/* Favorite */}
        <button 
          className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/50 hover:bg-black/70 text-white p-1 sm:p-1.5 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          title="Add to favorites"
          aria-label="Add to favorites"
        >
          <Star className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Game Info */}
      <div className="p-2 sm:p-3">
        <h3 className="text-white font-semibold mb-1 truncate text-sm sm:text-base">{game.name}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="truncate mr-2">{game.provider}</span>
          {game.rtp && <span className="flex-shrink-0">RTP: {game.rtp}%</span>}
        </div>
      </div>
    </div>
  );
}