'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GlobalPromotionalCarousel from '@/components/ui/GlobalPromotionalCarousel';
import { Play, Filter, Zap } from 'lucide-react';
import { useLiveOdds } from '@/hooks/useLiveOdds';

export default function LivePage() {
  const [selectedSport, setSelectedSport] = useState('all');
  const { matches, isLoading, error, refetch } = useLiveOdds(selectedSport);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading live matches...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex overflow-x-hidden">
        <Sidebar />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden">
          {/* Promotional Carousel */}
          <GlobalPromotionalCarousel />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-red-500 p-2 sm:p-3 rounded-xl">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Live Betting</h1>
                <p className="text-gray-400 text-xs sm:text-sm lg:text-base">Real-time odds and in-play betting</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base min-h-[44px]">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 min-h-[44px]">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-semibold text-sm sm:text-base">
                  {matches.length} Live
                </span>
              </div>
            </div>
          </div>

          {/* Sport Filter */}
          <div className="flex items-center space-x-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
            {['all', 'football', 'basketball', 'tennis', 'american-football'].map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm sm:text-base min-h-[44px] ${selectedSport === sport
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Live Matches Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {matches.map((match) => (
              <div key={match.id} className="relative">
                <MatchCard match={match} />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                  LIVE
                </div>
              </div>
            ))}

            {/* Skeleton Loading Cards for Demo */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bet-card">
                <div className="loading-skeleton h-4 w-24 mb-3" />
                <div className="space-y-2 mb-4">
                  <div className="loading-skeleton h-5 w-full" />
                  <div className="loading-skeleton h-5 w-full" />
                </div>
                <div className="flex space-x-2">
                  <div className="loading-skeleton h-12 flex-1" />
                  <div className="loading-skeleton h-12 flex-1" />
                  <div className="loading-skeleton h-12 flex-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {matches.length === 0 && !error && (
            <div className="text-center py-16">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Live Matches</h3>
              <p className="text-gray-400">Check back soon for live betting opportunities</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}