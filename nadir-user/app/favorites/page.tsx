'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MatchCard from '@/components/sports/MatchCard';
import GameCard from '@/components/casino/GameCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { matches, casinoGames } from '@/lib/mockData';
import { Star, Heart, Trash2 } from 'lucide-react';

export default function FavoritesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading favorites...</p>
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
              <div className="bg-yellow-500 p-3 rounded-xl">
                <Star className="w-6 h-6 text-black fill-current" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">My Favorites</h1>
                <p className="text-gray-400 text-sm sm:text-base">Your saved matches, teams, and games</p>
              </div>
            </div>
            
            <button className="flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-colors border border-red-500/30 w-full sm:w-auto">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Clear All</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg max-w-md">
            {[
              { id: 'matches', label: 'Matches' },
              { id: 'teams', label: 'Teams' },
              { id: 'games', label: 'Casino Games' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'matches' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Favorite Matches</h2>
                <span className="text-gray-400 text-sm">3 matches</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.slice(0, 3).map((match) => (
                  <div key={match.id} className="relative group">
                    <MatchCard match={match} />
                    <button className="absolute top-2 right-2 bg-yellow-500 text-black p-1 rounded opacity-100 group-hover:opacity-75 transition-opacity">
                      <Heart className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Favorite Teams</h2>
                <span className="text-gray-400 text-sm">5 teams</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Manchester United', league: 'Premier League', logo: 'MU' },
                  { name: 'Los Angeles Lakers', league: 'NBA', logo: 'LAL' },
                  { name: 'Real Madrid', league: 'La Liga', logo: 'RM' },
                  { name: 'Golden State Warriors', league: 'NBA', logo: 'GSW' },
                  { name: 'Barcelona', league: 'La Liga', logo: 'FCB' }
                ].map((team, i) => (
                  <div key={i} className="bet-card group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm">{team.logo}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        <p className="text-gray-400 text-sm">{team.league}</p>
                      </div>
                      <button className="text-yellow-500 opacity-100 group-hover:opacity-75 transition-opacity">
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Favorite Casino Games</h2>
                <span className="text-gray-400 text-sm">4 games</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {casinoGames.map((game) => (
                  <div key={game.id} className="relative group">
                    <GameCard game={game} />
                    <button className="absolute top-2 left-2 bg-yellow-500 text-black p-1 rounded opacity-100 group-hover:opacity-75 transition-opacity">
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(activeTab === 'matches' && matches.length === 0) && (
            <div className="text-center py-16">
              <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Favorite Matches</h3>
              <p className="text-gray-400 mb-6">Start adding matches to your favorites by clicking the star icon</p>
              <button className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors">
                Browse Matches
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}