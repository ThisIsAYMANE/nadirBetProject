'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import GameCard from '@/components/casino/GameCard';
import GameLaunchModal from '@/components/casino/GameLaunchModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PromotionalCarousel from '@/components/ui/PromotionalCarousel';
import { pragmaticApi } from '@/lib/api';
import { CasinoGame } from '@/types';
import { 
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
  const [games, setGames] = useState<CasinoGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await pragmaticApi.getGames();
      
      // Transform Pragmatic games to our CasinoGame format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedGames: CasinoGame[] = response.games.map((game: any) => ({
        id: game.id || game.symbol || game.gameId || String(Math.random()),
        name: game.name || game.title || 'Unknown Game',
        provider: 'Pragmatic Play',
        category: game.category || game.type || 'slots',
        isNew: game.isNew || false,
        isLive: game.isLive || game.type === 'live',
        jackpot: game.jackpot || undefined,
        rtp: game.rtp || undefined,
        // Store original game data for launching
        _pragmaticData: game
      }));
      
      setGames(transformedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      // Fallback to mock data on error
      const { casinoGames } = await import('@/lib/mockData');
      setGames(casinoGames);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayGame = (game: CasinoGame) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 min-w-0 overflow-x-hidden">
        {/* Promotional Carousel */}
        <PromotionalCarousel
          promotions={[
            {
              title: "Daily Cashback on Slots",
              description: "Get 15% daily cashback from what you spend on slot games",
              percentage: "15%",
              period: "Daily",
              type: "slots"
            },
            {
              title: "Daily Cashback on Live Games",
              description: "Get 10% daily cashback from what you spend on live games",
              percentage: "10%",
              period: "Daily",
              type: "live"
            },
            {
              title: "Weekly Cashback on Sports Betting",
              description: "Get 15% weekly cashback from what you spend on Paris sportive",
              percentage: "15%",
              period: "Weekly",
              type: "sports"
            }
          ]}
          autoplayDelay={5000}
        />

        {/* Category Navigation */}
        <div className="-mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-5 border-y border-gray-800 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center justify-start gap-3 sm:gap-4 md:gap-6 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex flex-col items-center space-y-2 px-3 sm:px-4 py-3 sm:py-4 transition-colors min-w-[70px] sm:min-w-[85px] rounded-lg ${
                    active 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-center">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Games Section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">ONLY AT FREEBET</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base self-start sm:self-auto">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {games.slice(0, 5).map((game) => (
              <div key={game.id} className="relative">
                <GameCard game={game} onPlay={handlePlayGame} />
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold">
                  EXCLUSIVE
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Casino Section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">YOUR LIVE CASINO</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base self-start sm:self-auto">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {games.filter(g => g.isLive).slice(0, 5).map((game) => (
              <div key={`live-${game.id}`} className="relative">
                <GameCard game={game} onPlay={handlePlayGame} />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold">
                  LIVE
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discover What's New Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">DISCOVER WHAT'S NEW</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base self-start sm:self-auto">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {games.length > 0 ? (
              games.map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))
            ) : (
              // Loading cards
              Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="casino-game-card">
                <div className="aspect-[4/3] loading-skeleton mb-3" />
                <div className="p-2 sm:p-3">
                  <div className="loading-skeleton h-4 w-full mb-2" />
                  <div className="loading-skeleton h-3 w-16" />
                </div>
              </div>
              ))
            )}
          </div>
        </section>

        {/* Game Launch Modal */}
        {selectedGame && (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pragmaticData = selectedGame._pragmaticData as any;
          const gameId = pragmaticData?.symbol || pragmaticData?.id || selectedGame.id;
          
          return (
            <GameLaunchModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              gameId={gameId}
              gameName={selectedGame.name}
            />
          );
        })()}
      </main>
    </div>
  );
}