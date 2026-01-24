'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import MatchListRow from '@/components/sports/MatchListRow';
import ViewToggle from '@/components/sports/ViewToggle';
import GameCard from '@/components/casino/GameCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PromotionalCarousel from '@/components/ui/PromotionalCarousel';
import { matches, liveMatches, casinoGames } from '@/lib/mockData';
import { TrendingUp, Flame, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLiveOdds } from '@/hooks/useLiveOdds';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Live odds for the "Live Now" section. We fall back to mockData
  // if the API returns no matches to keep the UI populated.
  const {
    matches: liveApiMatches,
  } = useLiveOdds('all', 0);

  const liveNowMatches = liveApiMatches.length ? liveApiMatches : liveMatches;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading Freebet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex overflow-x-hidden">
        <Sidebar />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden mt-4 sm:mt-6">
          {/* Promotional Carousel */}
          <PromotionalCarousel
            promotions={[
              {
                title: "Weekly Cashback on Sports Betting",
                description: "Get 15% weekly cashback from what you spend on Paris sportive",
                percentage: "15%",
                period: "Weekly",
                type: "sports"
              },
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
              }
            ]}
            autoplayDelay={5000}
          />

          {/* Hero Banner */}
          <div className="relative bg-gradient-to-r from-green-600 to-green-400 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4">
                Welcome to Freebet
              </h1>
              <p className="text-black/80 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-2xl">
                Experience the ultimate sports betting and casino platform with live odds, 
                extensive markets, and premium casino games.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/live" className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center sm:text-left min-h-[44px] flex items-center justify-center sm:justify-start">
                  View Live Matches
                </Link>
                <Link href="/casino" className="bg-white/20 text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors text-center sm:text-left min-h-[44px] flex items-center justify-center sm:justify-start">
                  Explore Casino
                </Link>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-60 h-60 sm:w-80 sm:h-80 bg-black/10 rounded-full hidden sm:block" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 sm:w-60 sm:h-60 bg-black/5 rounded-full hidden sm:block" />
          </div>

          {/* Live Matches */}
          <section className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Live Now</h2>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {liveNowMatches.length} LIVE
                </span>
              </div>
              <Link href="/live" className="flex items-center space-x-1 text-green-500 hover:text-green-400 transition-colors text-sm sm:text-base self-start sm:self-auto">
                <span>View All Live</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {liveNowMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>

          {/* Featured Matches */}
          <section className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Trending Matches</h2>
              </div>
              <div className="flex items-center space-x-3">
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
                <Link href="/sports" className="flex items-center space-x-1 text-green-500 hover:text-green-400 transition-colors text-sm sm:text-base self-start sm:self-auto">
                  <span>Browse All Sports</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {matches.slice(0, 8).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg overflow-hidden">
                {/* List View Header */}
                <div className="flex items-center px-3 sm:px-4 py-2.5 bg-gray-800/60 border-b border-gray-700/50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  <div className="w-20 sm:w-24 flex-shrink-0">
                    <span className="hidden sm:inline">HEURE</span>
                    <span className="sm:hidden">H</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="hidden sm:inline">ÉQUIPES</span>
                    <span className="sm:hidden">Match</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    <div className="min-w-[55px] sm:min-w-[65px] text-center">1</div>
                    {matches[0]?.odds.draw && (
                      <div className="min-w-[55px] sm:min-w-[65px] text-center">X</div>
                    )}
                    <div className="min-w-[55px] sm:min-w-[65px] text-center">2</div>
                  </div>
                </div>
                <div>
                  {matches.slice(0, 8).map((match) => (
                    <MatchListRow key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Casino Preview */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Featured Casino Games</h2>
              </div>
              <Link href="/casino" className="flex items-center space-x-1 text-green-500 hover:text-green-400 transition-colors text-sm sm:text-base self-start sm:self-auto">
                <span>Explore Casino</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {casinoGames.slice(0, 6).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}