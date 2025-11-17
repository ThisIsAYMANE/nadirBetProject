'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, Menu, Bell, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { sports } from '@/lib/mockData';

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/freebet.png"
              alt="Freebet"
              width={320}
              height={100}
              className="h-16 w-auto"
              priority
            />
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-green-500 transition-colors font-medium">
              Home
            </Link>
            <Link href="/live" className="text-gray-300 hover:text-green-500 transition-colors font-medium">
              Live
            </Link>
            <Link href="/casino" className="text-gray-300 hover:text-green-500 transition-colors font-medium">
              Casino
            </Link>
            <Link href="/favorites" className="text-gray-300 hover:text-green-500 transition-colors font-medium">
              Favorites
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search teams, leagues, games..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hidden md:flex text-gray-300 hover:text-white">
              <Bell className="w-4 h-4 mr-2" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            <div className="hidden md:flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
              <Wallet className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-semibold">$1,247.50</span>
            </div>

            <Link href="/profile" className="hidden md:flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden text-gray-300 hover:text-white"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-gray-900 text-white border-gray-800">
                <div className="flex h-full flex-col">
                  <div className="p-4 border-b border-gray-800 shrink-0">
                    <SheetHeader>
                      <SheetTitle className="text-white">Navigation</SheetTitle>
                    </SheetHeader>
                  </div>
                  <nav className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-2">
                      <Link href="/" className="block text-gray-300 hover:text-green-500 transition-colors">
                        Home
                      </Link>
                      <Link href="/live" className="block text-gray-300 hover:text-green-500 transition-colors">
                        Live
                      </Link>
                      <Link href="/casino" className="block text-gray-300 hover:text-green-500 transition-colors">
                        Casino
                      </Link>
                      <Link href="/favorites" className="block text-gray-300 hover:text-green-500 transition-colors">
                        Favorites
                      </Link>
                      <Link href="/profile" className="block text-gray-300 hover:text-green-500 transition-colors">
                        Profile
                      </Link>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-3">
                        Sports
                      </h3>
                      <div className="space-y-1">
                        {sports.map((sport) => (
                          <Link
                            key={sport.id}
                            href={`/sports/${sport.id}`}
                            className="flex items-center justify-between px-4 py-3 bg-gray-800/60 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <span className="flex items-center space-x-3">
                              <span className="text-lg">{sport.icon}</span>
                              <span className="text-sm text-gray-200">{sport.name}</span>
                            </span>
                            <span className="ml-auto bg-green-500 text-black text-xs px-2 py-1 rounded-full">
                              {sport.matchCount}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}