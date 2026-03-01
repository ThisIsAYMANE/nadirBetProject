'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PromotionalBanner from '@/components/ui/PromotionalBanner';
import { useSportsData } from '@/hooks/useSportsData';
import { Filter, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

interface SportConfig {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  leagues: { key: string; label: string }[];
}

interface DynamicSportPageProps {
  config: SportConfig;
}

export default function DynamicSportPage({ config }: DynamicSportPageProps) {
  const [selectedLeague, setSelectedLeague] = useState('all');
  const { matches, isLoading, error, refetch } = useSportsData(config.key, selectedLeague);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading {config.name}...</p>
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
          {/* Promotional Banner - Sports Cashback */}
          <PromotionalBanner
            title="Weekly Cashback on Sports Betting"
            description="Get 15% weekly cashback from what you spend on Paris sportive"
            percentage="15%"
            period="Weekly"
            type="sports"
            image="/banners/Sport-vf.png"
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`${config.color} p-2 sm:p-3 rounded-xl`}>
                <span className="text-xl sm:text-2xl">{config.icon}</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{config.name}</h1>
                <p className="text-gray-400 text-xs sm:text-sm lg:text-base">{config.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={refetch}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base min-h-[44px]">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 min-h-[44px]">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-semibold text-sm sm:text-base">Live</span>
              </div>
            </div>
          </div>

          {/* League Filter */}
          {config.leagues.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
              <button
                onClick={() => setSelectedLeague('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm sm:text-base min-h-[44px] ${selectedLeague === 'all'
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                All Leagues
              </button>
              {config.leagues.map((league) => (
                <button
                  key={league.key}
                  onClick={() => setSelectedLeague(league.key)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm sm:text-base min-h-[44px] ${selectedLeague === league.key
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {league.label}
                </button>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-500 font-semibold mb-1">Error Loading Data</h3>
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Matches Grid */}
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : !error ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No matches available</div>
              <p className="text-gray-500 text-sm">Check back later for upcoming events</p>
            </div>
          ) : null}

          {/* Loading placeholders when refreshing with data */}
          {isLoading && matches.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bet-card">
                  <div className="loading-skeleton h-4 w-24 mb-3" />
                  <div className="space-y-2 mb-4">
                    <div className="loading-skeleton h-5 w-full" />
                    <div className="loading-skeleton h-5 w-full" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="loading-skeleton h-12 flex-1" />
                    <div className="loading-skeleton h-12 flex-1" />
                    {config.key === 'football' && <div className="loading-skeleton h-12 flex-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

