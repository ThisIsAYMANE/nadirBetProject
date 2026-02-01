'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/layout/Header';
import GameCard from '@/components/casino/GameCard';
import GameLaunchModal from '@/components/casino/GameLaunchModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PromotionalCarousel from '@/components/ui/PromotionalCarousel';
import Pagination from '@/components/ui/Pagination';
import { casinoApi, GAMES_FETCH_TIMEOUT_MS } from '@/lib/casinoApi';
import { CasinoGame } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  ChevronRight,
  X,
  Search,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';

export default function CasinoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('home');
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerList, setProviderList] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [games, setGames] = useState<CasinoGame[]>([]); // Store current page games
  const GAMES_PER_PAGE = 50; // Slotegrator max per page; 10 rows × 5 games per row (desktop)

  // Device detection - filter games by is_mobile
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch provider list from API for filter dropdown
  useEffect(() => {
    let cancelled = false;
    const loadProviders = async () => {
      try {
        const res = await casinoApi.getProviders('EUR');
        if (cancelled) return;
        const list: string[] = [];
        if (Array.isArray(res)) {
          res.forEach((item: { providers?: string[] }) => {
            if (item?.providers?.length) list.push(...item.providers);
          });
        } else if (res && typeof res === 'object' && Array.isArray((res as { providers?: string[] }).providers)) {
          list.push(...(res as { providers: string[] }).providers);
        }
        const unique = Array.from(new Set(list)).filter(Boolean).sort();
        setProviderList(unique);
      } catch {
        if (!cancelled) setProviderList([]);
      }
    };
    loadProviders();
    return () => { cancelled = true; };
  }, []);

  // AbortController ref so we can cancel the previous request when filters change
  const abortRef = useRef<AbortController | null>(null);

  // Fetch games for a specific page from API (one request; backend does one Slotegrator call when provider/type set)
  const fetchGames = async (page: number, signal: AbortSignal) => {
    try {
      setIsLoading(true);

      const filters: any = {
        page,
        perPage: GAMES_PER_PAGE,
        expand: 'tags,parameters,images',
        device: isMobile ? 'mobile' : 'desktop',
      };
      if (selectedProvider) filters.provider = selectedProvider;
      if (selectedCategory !== 'home' && selectedCategory !== 'all') {
        const categoryTypeMap: Record<string, string> = {
          'slots': 'Slots',
          'live': 'Live Casino',
          'table': 'Table Games',
          'jackpots': 'Jackpots',
        };
        if (categoryTypeMap[selectedCategory]) filters.type = categoryTypeMap[selectedCategory];
      }

      const response = await casinoApi.getGames(filters, signal);

      if (signal.aborted) return;

      const transformedGames: CasinoGame[] = (response.items || []).map((game) => ({
        uuid: game.uuid,
        id: game.uuid,
        name: game.name,
        image: game.image,
        type: game.type,
        provider: game.provider,
        provider_id: game.provider_id,
        technology: game.technology,
        has_lobby: game.has_lobby,
        is_mobile: game.is_mobile,
        has_freespins: game.has_freespins,
        has_tables: game.has_tables,
        label: game.label,
        tags: game.tags,
        parameters: game.parameters,
        images: game.images,
        related_games: game.related_games,
        category: game.type?.toLowerCase() || 'slots',
        isNew: game.tags?.some(tag => tag.code === 'new') || false,
        isLive: game.type?.toLowerCase().includes('live') || false,
        rtp: game.parameters?.rtp,
      }));

      setGames(transformedGames);
      const meta = response._meta || {};
      setTotalPages(meta.pageCount || 1);
    } catch (error) {
      if (signal.aborted) return;
      console.error('Error fetching games:', error);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of games section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter games by device (is_mobile) - filter current page games
  const deviceFilteredGames = useMemo(() => {
    return games.filter(game => {
      // Desktop: show only games where is_mobile === 0
      // Mobile: show only games where is_mobile === 1
      return isMobile ? game.is_mobile === 1 : game.is_mobile === 0;
    });
  }, [games, isMobile]);

  // Filter by search (client-side only) and by provider (safety net: only show selected provider)
  const filteredGames = useMemo(() => {
    let filtered = deviceFilteredGames;

    // Provider filter: only show games from selected provider (case-insensitive, in case backend returned mixed)
    if (selectedProvider) {
      const want = selectedProvider.toLowerCase().trim();
      filtered = filtered.filter(
        (game) => game.provider && game.provider.toLowerCase().trim() === want
      );
    }

    // Search filter (client-side only)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(query) ||
        game.provider.toLowerCase().includes(query) ||
        game.type.toLowerCase().includes(query)
      );
    }

    // Additional client-side category filters for special categories
    if (selectedCategory !== 'home' && selectedCategory !== 'all') {
      // These categories need client-side filtering (not supported by API)
      if (selectedCategory === 'jackpots') {
        filtered = filtered.filter(game => 
          game.tags?.some(tag => tag.code === 'jackpots') || game.jackpot !== undefined
        );
      }
      if (selectedCategory === 'new') {
        filtered = filtered.filter(game => 
          game.isNew || game.tags?.some(tag => tag.code === 'new')
        );
      }
    }

    return filtered;
  }, [deviceFilteredGames, selectedCategory, searchQuery, selectedProvider]);

  const handlePlayGame = (game: CasinoGame) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  // Provider options: API list first, then any from current page not in list
  const providerOptions = useMemo(() => {
    const fromGames = new Set(deviceFilteredGames.map(g => g.provider).filter(Boolean));
    const combined = new Set(providerList);
    fromGames.forEach(p => combined.add(p));
    return Array.from(combined).sort();
  }, [providerList, deviceFilteredGames]);

  // Note: With server-side pagination, we can't filter on the server
  // So filters work on the current page only
  // For full filtering, we'd need to implement server-side filtering in the backend
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProvider, selectedCategory]);

  // Fetch games when page or filters change (one request at a time, with timeout so it never loads forever)
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GAMES_FETCH_TIMEOUT_MS);
    abortRef.current = controller;

    fetchGames(currentPage, controller.signal);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedProvider, selectedCategory]);

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

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-gray-800/90 to-gray-800/50 border border-gray-600/60 shadow-lg shadow-black/20">
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-green-400 transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900/70 border border-gray-600/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/80 focus:ring-2 focus:ring-green-500/25 transition-all text-sm sm:text-base"
              />
            </div>
            {/* Provider Filter — single chip when selected */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-gray-400 text-sm font-medium shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Provider</span>
              </div>
              <div className="relative flex items-stretch flex-1 sm:flex-initial min-w-0 rounded-xl overflow-hidden border border-gray-600/80 bg-gray-900/70 focus-within:border-green-500/80 focus-within:ring-2 focus-within:ring-green-500/25 transition-all">
                <label htmlFor="provider-filter" className="sr-only">
                  Filter by provider
                </label>
                <select
                  id="provider-filter"
                  value={selectedProvider || ''}
                  onChange={(e) => setSelectedProvider(e.target.value || null)}
                  className={`flex-1 min-w-0 appearance-none bg-transparent pl-4 py-3 text-white text-sm sm:text-base focus:outline-none cursor-pointer w-full sm:min-w-[200px] ${selectedProvider ? 'pr-14' : 'pr-10'}`}
                  aria-label="Filter by provider"
                >
                  <option value="">All providers</option>
                  {providerOptions.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none ${selectedProvider ? 'right-11' : 'right-3'}`} />
                {selectedProvider && (
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    className="flex items-center justify-center w-11 h-full shrink-0 bg-gray-700/60 hover:bg-gray-600/80 text-gray-400 hover:text-white transition-colors border-l border-gray-600/80"
                    aria-label="Clear provider filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

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
            {(selectedProvider ? filteredGames : deviceFilteredGames).slice(0, 5).map((game) => (
              <div key={game.uuid || game.id} className="relative">
                <GameCard game={game} onPlay={handlePlayGame} />
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold">
                  EXCLUSIVE
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Casino Section - Only show if we have live games on current page */}
        {(selectedProvider ? filteredGames : deviceFilteredGames).filter(g => g.isLive).length > 0 && (
          <section className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">YOUR LIVE CASINO</h2>
              <button className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base self-start sm:self-auto">
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {(selectedProvider ? filteredGames : deviceFilteredGames).filter(g => g.isLive).slice(0, 5).map((game) => (
                <div key={`live-${game.uuid || game.id}`} className="relative">
                  <GameCard game={game} onPlay={handlePlayGame} />
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold">
                    LIVE
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discover What's New Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {selectedCategory === 'all' ? 'ALL GAMES' : "DISCOVER WHAT'S NEW"}
            </h2>
            {selectedCategory !== 'all' && (
              <button 
                onClick={() => setSelectedCategory('all')}
                className="text-green-500 hover:text-green-400 flex items-center space-x-1 text-sm sm:text-base self-start sm:self-auto"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {filteredGames.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {isMobile 
                  ? 'No mobile games available at the moment.' 
                  : 'No desktop games available at the moment.'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery || selectedProvider 
                  ? 'Try adjusting your filters.' 
                  : 'Please check back later.'}
              </p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <GameCard key={game.uuid || game.id} game={game} onPlay={handlePlayGame} />
                ))
              ) : (
                // Loading cards (10 rows × 5 = 50, matches Slotegrator max per page)
                Array.from({ length: 50 }).map((_, i) => (
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

            {/* Pagination Component */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            )}

            {/* Pagination Info */}
            {filteredGames.length > 0 && (
              <div className="mt-4 text-center text-gray-400 text-sm">
                Showing {filteredGames.length} games on page {currentPage} of {totalPages}
                {totalPages > 1 && ` (${(currentPage - 1) * GAMES_PER_PAGE + 1}-${Math.min(currentPage * GAMES_PER_PAGE, filteredGames.length)} of many)`}
              </div>
            )}
            </>
          )}
        </section>

        {/* Game Launch Modal */}
        {selectedGame && (
          <GameLaunchModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            gameId={selectedGame.uuid || selectedGame.id || ''}
            gameName={selectedGame.name}
          />
        )}
      </main>
    </div>
  );
}