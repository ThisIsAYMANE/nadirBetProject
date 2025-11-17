'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Star, TrendingUp } from 'lucide-react';
import { sports } from '@/lib/mockData';

export default function Sidebar() {
  const [expandedSports, setExpandedSports] = useState<string[]>(['football']);

  const toggleSport = (sportId: string) => {
    setExpandedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  return (
    <aside className="hidden lg:block w-64 bg-gray-900 border-r border-gray-800 h-screen overflow-y-auto sticky top-16">
      <div className="p-4">
        {/* Quick Links */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 px-4 py-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-semibold">Trending Now</span>
          </div>
        </div>

        <div className="mb-6">
          <Link href="/favorites" className="sport-nav-item">
            <Star className="w-4 h-4" />
            <span>My Favorites</span>
            <span className="ml-auto bg-green-500 text-black text-xs px-2 py-1 rounded-full">12</span>
          </Link>
        </div>

        {/* Sports Navigation */}
        <div className="mb-4">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-3 px-4">
            Sports
          </h3>
          <div className="space-y-1">
            {sports.map((sport) => (
              <div key={sport.id}>
                <button
                  onClick={() => toggleSport(sport.id)}
                  className="sport-nav-item w-full justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{sport.icon}</span>
                    <span className="text-sm">{sport.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{sport.matchCount}</span>
                    <ChevronRight 
                      className={`w-3 h-3 transition-transform ${
                        expandedSports.includes(sport.id) ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </button>
                
                {expandedSports.includes(sport.id) && (
                  <div className="ml-6 mt-2 space-y-1">
                    <Link href={`/sports/${sport.id}`} className="block text-sm text-gray-400 hover:text-green-500 py-1 px-4">
                      All {sport.name}
                    </Link>
                    <Link href="/live" className="block text-sm text-gray-400 hover:text-green-500 py-1 px-4">
                      Live Matches
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}