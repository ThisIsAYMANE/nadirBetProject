'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PromotionalBanner from '@/components/ui/PromotionalBanner';
import { matches } from '@/lib/mockData';
import { Filter, TrendingUp } from 'lucide-react';

export default function FootballPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const footballMatches = matches.filter(match => match.sport === 'football');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading Football...</p>
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
              <div className="bg-green-600 p-2 sm:p-3 rounded-xl">
                <span className="text-xl sm:text-2xl">⚽</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Football</h1>
                <p className="text-gray-400 text-xs sm:text-sm lg:text-base">Premier League, Champions League & More</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base min-h-[44px]">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 min-h-[44px]">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-semibold text-sm sm:text-base">Trending</span>
              </div>
            </div>
          </div>

          {/* League Filter */}
          <div className="flex items-center space-x-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
            {['all', 'premier-league', 'champions-league', 'la-liga', 'serie-a', 'bundesliga'].map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm sm:text-base min-h-[44px] ${
                  selectedLeague === league
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {league === 'all' ? 'All Leagues' : league.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {footballMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            
            {/* Mock additional matches */}
            {Array.from({ length: 12 }).map((_, i) => (
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
        </main>
      </div>
    </div>
  );
}