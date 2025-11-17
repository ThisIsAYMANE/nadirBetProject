'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { matches } from '@/lib/mockData';
import { Filter, TrendingUp } from 'lucide-react';

export default function BoxingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const boxingMatches = matches.filter(match => match.sport === 'boxing');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading Boxing...</p>
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
        
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-red-600 p-3 rounded-xl">
                <span className="text-2xl">🥊</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Boxing</h1>
                <p className="text-gray-400 text-sm sm:text-base">Professional Boxing Matches</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-semibold text-sm sm:text-base">Trending</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
            {['all', 'heavyweight', 'middleweight', 'lightweight', 'title-fights'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boxingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            
            {/* Mock additional matches */}
            {Array.from({ length: 6 }).map((_, i) => (
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
        </main>
      </div>
    </div>
  );
}