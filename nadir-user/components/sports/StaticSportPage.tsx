'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import MatchListRow from '@/components/sports/MatchListRow';
import ViewToggle from '@/components/sports/ViewToggle';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PromotionalBanner from '@/components/ui/PromotionalBanner';
import { matches } from '@/lib/mockData';
import { Filter, TrendingUp } from 'lucide-react';

interface SportConfig {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface StaticSportPageProps {
  config: SportConfig;
}

export default function StaticSportPage({ config }: StaticSportPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const sportMatches = matches.filter(match => match.sport === config.key);

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
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ViewToggle view={view} onViewChange={setView} />
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base min-h-[44px]">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 min-h-[44px]">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-semibold text-sm sm:text-base hidden lg:inline">Trending</span>
              </div>
            </div>
          </div>

          {/* Matches Display */}
          {sportMatches.length > 0 ? (
            view === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sportMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 overflow-hidden">
                {/* Table Header */}
                <div className="border-b border-gray-700/50 bg-gray-800/60">
                  <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3 gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-20 sm:w-24">
                      <span className="text-xs text-gray-400 font-semibold uppercase">HEURE</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 font-semibold uppercase">ÉQUIPES</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                      <div className="text-xs text-gray-400 font-semibold uppercase min-w-[55px] sm:min-w-[65px] text-center">1</div>
                      <div className="text-xs text-gray-400 font-semibold uppercase min-w-[55px] sm:min-w-[65px] text-center">X</div>
                      <div className="text-xs text-gray-400 font-semibold uppercase min-w-[55px] sm:min-w-[65px] text-center">2</div>
                    </div>
                  </div>
                </div>
                {/* Match Rows */}
                {sportMatches.map((match) => (
                  <MatchListRow key={match.id} match={match} category={config.key} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No matches available</div>
              <p className="text-gray-500 text-sm">Check back later for upcoming events</p>
            </div>
          )}

          {/* Mock additional matches for visual completeness */}
          {sportMatches.length === 0 && (
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

