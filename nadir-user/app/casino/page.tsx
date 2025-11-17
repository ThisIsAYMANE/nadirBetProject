'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import GameCard from '@/components/casino/GameCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { casinoGames } from '@/lib/mockData';
import { 
  Search, 
  Home, 
  Percent, 
  Star, 
  Users, 
  Zap, 
  Rocket, 
  Circle, 
  Trophy, 
  Grid3X3,
  ChevronRight
} from 'lucide-react';

export default function CasinoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-400 mt-4">Loading casino...</p>
          </div>
        </main>
      </div>
    );
  }

  const categories = [
    { id: 'home', name: 'Home', icon: Home, active: true },
    { id: 'offers', name: 'Offers', icon: Percent },
    { id: 'new', name: "What's New", icon: Star },
    { id: 'live', name: 'Live Casino', icon: Users },
    { id: 'slots', name: 'Slots', icon: Zap },
    { id: 'table', name: 'Table & Card', icon: Circle },
    { id: 'crash', name: 'Crash & Arcade', icon: Rocket },
    { id: 'poker', name: 'Poker', icon: Circle },
    { id: 'jackpots', name: 'Jackpots', icon: Trophy },
    { id: 'bingo', name: 'Bingo', icon: Circle },
    { id: 'all', name: 'All Games', icon: Grid3X3 }
  ];

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 min-w-0 overflow-x-hidden">
        {/* Category Navigation */}
        <div className="-mx-4 px-4 py-3 border-y border-gray-800 mb-6 overflow-x-auto">
          <div className="flex items-center justify-start gap-6 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex flex-col items-center space-y-1 px-2 py-2 transition-colors ${
                    active ? 'text-green-500' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium whitespace-nowrap">{category.name}</span>
                </button>
              );
            })}
            <div className="relative hidden md:block ml-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games or providers"
                className="w-72 bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Featured Games Section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">ONLY AT FREEBET</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {casinoGames.slice(0, 5).map((game) => (
              <div key={game.id} className="relative">
                <GameCard game={game} />
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                  EXCLUSIVE
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Casino Section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">YOUR LIVE CASINO</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {casinoGames.slice(0, 5).map((game) => (
              <div key={`live-${game.id}`} className="relative">
                <GameCard game={game} />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                  LIVE
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discover What's New Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">DISCOVER WHAT'S NEW</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {casinoGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            
            {/* Loading cards */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="casino-game-card">
                <div className="aspect-[4/3] loading-skeleton mb-3" />
                <div className="p-3">
                  <div className="loading-skeleton h-4 w-full mb-2" />
                  <div className="loading-skeleton h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}