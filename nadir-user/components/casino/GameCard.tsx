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
        <div className="text-center p-4">
          <div className="text-2xl font-bold text-white mb-2">{game.name.charAt(0)}</div>
          <div className="text-xs text-gray-300 uppercase tracking-wider">{game.category}</div>
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
          <button className="bg-green-500 text-black px-6 py-2 rounded-full font-semibold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2">
            <Play className="w-4 h-4 fill-current" />
            <span>Play Now</span>
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {game.isNew && (
            <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold">NEW</span>
          )}
          {game.isLive && (
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">LIVE</span>
          )}
        </div>

        {/* Jackpot */}
        {game.jackpot && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span className="text-xs font-bold">{formatJackpot(game.jackpot)}</span>
          </div>
        )}

        {/* Favorite */}
        <button 
          className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded transition-colors"
          title="Add to favorites"
          aria-label="Add to favorites"
        >
          <Star className="w-3 h-3" />
        </button>
      </div>

      {/* Game Info */}
      <div className="p-3">
        <h3 className="text-white font-semibold mb-1 truncate">{game.name}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{game.provider}</span>
          {game.rtp && <span>RTP: {game.rtp}%</span>}
        </div>
      </div>
    </div>
  );
}