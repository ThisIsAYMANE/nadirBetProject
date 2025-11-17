'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import GameCard from '@/components/casino/GameCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { matches, liveMatches, casinoGames } from '@/lib/mockData';
import { TrendingUp, Flame, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

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
        
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          {/* Hero Banner */}
          <div className="relative bg-gradient-to-r from-green-600 to-green-400 rounded-xl p-6 sm:p-8 mb-8 overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
                Welcome to Freebet
              </h1>
              <p className="text-black/80 text-base sm:text-lg mb-6 max-w-2xl">
                Experience the ultimate sports betting and casino platform with live odds, 
                extensive markets, and premium casino games.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/live" className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center sm:text-left">
                  View Live Matches
                </Link>
                <Link href="/casino" className="bg-white/20 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors text-center sm:text-left">
                  Explore Casino
                </Link>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-60 h-60 sm:w-80 sm:h-80 bg-black/10 rounded-full hidden sm:block" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 sm:w-60 sm:h-60 bg-black/5 rounded-full hidden sm:block" />
          </div>

          {/* Live Matches */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Live Now</h2>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {liveMatches.length} LIVE
                </span>
              </div>
              <Link href="/live" className="flex items-center space-x-1 text-green-500 hover:text-green-400 transition-colors text-sm sm:text-base">
                <span>View All Live</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>

          {/* Featured Matches */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Matches</h2>
              </div>
              <Link href="/sports" className="flex items-center space-x-1 text-green-500 hover:text-green-400 transition-colors text-sm sm:text-base">
                <span>Browse All Sports</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {matches.slice(0, 8).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>

          {/* Casino Preview */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Featured Casino Games</h2>
              </div>
              <Link href="/casino" className="flex items-center space-x-1 text-green-500 hover:text-green-400 transition-colors text-sm sm:text-base">
                <span>Explore Casino</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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