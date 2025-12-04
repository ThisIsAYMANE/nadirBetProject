'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, User, Menu, Bell, Wallet, Home, PlayCircle, Gamepad2, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { sports } from '@/lib/mockData';

export default function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-50 shadow-lg overflow-visible">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Top Navigation Bar - Mobile */}
        <div className="flex items-center justify-between py-2 border-b border-gray-800 md:hidden">
          <nav className="flex items-center space-x-5 flex-1">
            <Link 
              href="/" 
              className={`transition-colors text-sm font-medium py-1 ${
                isActive('/') && pathname !== '/casino' && pathname !== '/favorites'
                  ? 'text-green-500 font-semibold'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Sports
            </Link>
            <Link 
              href="/casino" 
              className={`transition-colors text-sm font-medium py-1 ${
                isActive('/casino')
                  ? 'text-green-500 font-semibold'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Casino
            </Link>
            <Link 
              href="/favorites" 
              className={`transition-colors text-sm font-medium py-1 ${
                isActive('/favorites')
                  ? 'text-green-500 font-semibold'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Fantasy
            </Link>
          </nav>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between h-16 sm:h-20 py-2">
          {/* Mobile Menu Button - Left Side (Mobile Only) */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-300 hover:text-white p-2"
                >
                  <Menu className="w-6 h-6" />
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
                    {/* Main Navigation Items */}
                    <div className="space-y-2">
                      <Link 
                        href="/" 
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isActive('/') && pathname !== '/live' && pathname !== '/casino' && pathname !== '/favorites'
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Home className="w-5 h-5" />
                          <span className="text-sm font-medium">Home</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                      <Link 
                        href="/live" 
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isActive('/live')
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <PlayCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Live</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                      <Link 
                        href="/casino" 
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isActive('/casino')
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Gamepad2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Casino</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                      <Link 
                        href="/favorites" 
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isActive('/favorites')
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Star className="w-5 h-5" />
                          <span className="text-sm font-medium">Favorites</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                      <Link 
                        href="/profile" 
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isActive('/profile')
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5" />
                          <span className="text-sm font-medium">Profile</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                    </div>

                    {/* Sports Section */}
                    <div className="pt-4 border-t border-gray-800">
                      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3 px-4">
                        Sports
                      </h3>
                      <div className="space-y-2">
                        {sports.map((sport) => {
                          const isSportActive = pathname.startsWith(`/sports/${sport.id}`);
                          return (
                            <Link
                              key={sport.id}
                              href={`/sports/${sport.id}`}
                              className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                                isSportActive
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                  : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-800/60 hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{sport.icon}</span>
                                <span className="text-sm font-medium">{sport.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isSportActive
                                    ? 'bg-cyan-500/30 text-cyan-300'
                                    : 'bg-green-500/20 text-green-400'
                                }`}>
                                  {sport.matchCount}
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-50" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - Centered on Mobile, Left on Desktop */}
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity h-full py-1 md:mr-8 lg:mr-12 absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none">
            <Image
              src="/freebet.png"
              alt="Freebet"
              width={180}
              height={45}
              className="h-10 sm:h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 xl:space-x-10">
            <Link 
              href="/" 
              className={`transition-colors font-medium text-sm lg:text-base xl:text-lg py-2 px-1 relative group ${
                isActive('/') && pathname !== '/live' && pathname !== '/casino' && pathname !== '/favorites'
                  ? 'text-green-500'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Home
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all ${
                isActive('/') && pathname !== '/live' && pathname !== '/casino' && pathname !== '/favorites'
                  ? 'w-full'
                  : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link 
              href="/live" 
              className={`transition-colors font-medium text-sm lg:text-base xl:text-lg py-2 px-1 relative group ${
                isActive('/live')
                  ? 'text-green-500'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Live
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all ${
                isActive('/live')
                  ? 'w-full'
                  : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link 
              href="/casino" 
              className={`transition-colors font-medium text-sm lg:text-base xl:text-lg py-2 px-1 relative group ${
                isActive('/casino')
                  ? 'text-green-500'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Casino
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all ${
                isActive('/casino')
                  ? 'w-full'
                  : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
            <Link 
              href="/favorites" 
              className={`transition-colors font-medium text-sm lg:text-base xl:text-lg py-2 px-1 relative group ${
                isActive('/favorites')
                  ? 'text-green-500'
                  : 'text-gray-300 hover:text-green-500'
              }`}
            >
              Favorites
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all ${
                isActive('/favorites')
                  ? 'w-full'
                  : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-lg mx-6 xl:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teams, leagues, games..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
            <Button variant="ghost" size="sm" className="hidden md:flex text-gray-300 hover:text-white hover:bg-gray-800 p-2.5 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            <div className="hidden sm:flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all cursor-pointer">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-green-500 font-bold text-sm sm:text-base">$1,247.50</span>
            </div>

            {/* Profile Icon - Always Visible */}
            <Link href="/profile" className="flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 transition-colors p-2 md:p-2.5 rounded-lg">
              <User className="w-5 h-5 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden pb-3 pt-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teams, leagues, games..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </header>
  );
}