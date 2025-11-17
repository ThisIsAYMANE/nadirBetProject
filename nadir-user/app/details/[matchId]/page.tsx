'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { matches } from '@/lib/mockData';
import { ArrowLeft, Heart, Share2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function MatchDetailsPage() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState(matches[0]); // Use first match as default

  useEffect(() => {
    const timer = setTimeout(() => {
      // Find match by ID (for demo, just use first match)
      const foundMatch = matches.find(m => m.id === params.matchId) || matches[0];
      setMatch(foundMatch);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [params.matchId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading match details...</p>
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
          {/* Back Button */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Match Header */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                <span className="bg-blue-500 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  {match.league}
                </span>
                {match.status === 'live' && (
                  <span className="bg-red-500 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Home Team */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {match.homeTeam.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{match.homeTeam}</h2>
                {match.status === 'live' && match.homeScore !== undefined && (
                  <div className="text-3xl font-bold text-green-500 mt-2">
                    {match.homeScore}
                  </div>
                )}
              </div>

              {/* Match Info */}
              <div className="text-center">
                {match.status === 'live' ? (
                  <div>
                    <div className="text-lg text-green-500 font-semibold mb-2">LIVE</div>
                    {match.minute && (
                      <div className="text-3xl font-bold text-white">{match.minute}'</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 mb-2">
                      {new Date(match.startTime).toLocaleDateString()}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {new Date(match.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {match.awayTeam.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{match.awayTeam}</h2>
                {match.status === 'live' && match.awayScore !== undefined && (
                  <div className="text-3xl font-bold text-green-500 mt-2">
                    {match.awayScore}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Betting Markets */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Markets */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Main Markets</h3>
                
                <div className="space-y-4">
                  {/* Match Result */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Match Result</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">{match.homeTeam}</div>
                        <div className="font-bold">{match.odds.home}</div>
                      </button>
                      {match.odds.draw && (
                        <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                          <div className="text-sm text-gray-300 mb-1">Draw</div>
                          <div className="font-bold">{match.odds.draw}</div>
                        </button>
                      )}
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">{match.awayTeam}</div>
                        <div className="font-bold">{match.odds.away}</div>
                      </button>
                    </div>
                  </div>

                  {/* Over/Under */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Total Goals</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">Over 2.5</div>
                        <div className="font-bold">1.85</div>
                      </button>
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">Under 2.5</div>
                        <div className="font-bold">1.95</div>
                      </button>
                    </div>
                  </div>

                  {/* Both Teams to Score */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Both Teams to Score</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">Yes</div>
                        <div className="font-bold">1.70</div>
                      </button>
                      <button className="bg-gray-700 hover:bg-green-500 text-white p-3 rounded-lg transition-colors">
                        <div className="text-sm text-gray-300 mb-1">No</div>
                        <div className="font-bold">2.10</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Match Statistics</span>
                </h3>
                
                <div className="space-y-4">
                  {[
                    { label: 'Possession', home: 58, away: 42 },
                    { label: 'Shots', home: 12, away: 8 },
                    { label: 'Shots on Target', home: 5, away: 3 },
                    { label: 'Corners', home: 7, away: 4 },
                    { label: 'Fouls', home: 11, away: 14 }
                  ].map((stat, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{stat.home}%</span>
                        <span className="text-gray-400">{stat.label}</span>
                        <span className="text-white font-medium">{stat.away}%</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full transition-all duration-500"
                          style={{ width: `${stat.home}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Bets */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Popular Bets</span>
                </h3>
                
                <div className="space-y-3">
                  {[
                    { selection: `${match.homeTeam} to Win`, odds: match.odds.home, percentage: 45 },
                    { selection: `Over 2.5 Goals`, odds: 1.85, percentage: 67 },
                    { selection: `Both Teams Score`, odds: 1.70, percentage: 52 }
                  ].map((bet, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm">{bet.selection}</span>
                        <span className="text-green-500 font-bold">{bet.odds}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {bet.percentage}% of users backed this
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Form */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Recent Form</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-white font-medium mb-2">{match.homeTeam}</div>
                    <div className="flex space-x-1">
                      {['W', 'W', 'D', 'L', 'W'].map((result, i) => (
                        <div 
                          key={i}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-500 text-white' :
                            result === 'D' ? 'bg-gray-500 text-white' :
                            'bg-red-500 text-white'
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-white font-medium mb-2">{match.awayTeam}</div>
                    <div className="flex space-x-1">
                      {['L', 'W', 'W', 'D', 'W'].map((result, i) => (
                        <div 
                          key={i}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                            result === 'W' ? 'bg-green-500 text-white' :
                            result === 'D' ? 'bg-gray-500 text-white' :
                            'bg-red-500 text-white'
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}