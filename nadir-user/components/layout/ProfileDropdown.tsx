'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Coins, History } from 'lucide-react';

interface ProfileDropdownProps {
  userName?: string;
  userEmail?: string;
}

export default function ProfileDropdown({ userName, userEmail }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to home
    router.push('/');
    
    // Reload to update UI state
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Profile Menu"
        className="flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 transition-colors p-2 md:p-2.5 rounded-lg"
      >
        <User className="w-6 h-6 md:w-7 md:h-7" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/80">
            <p className="text-white font-semibold truncate">
              {userName || 'User'}
            </p>
            <p className="text-gray-400 text-sm truncate">
              {userEmail || 'user@example.com'}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">My Profile</span>
            </Link>

            <Link
              href="/profile?tab=points"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Coins className="w-5 h-5" />
              <span className="text-sm font-medium">Points</span>
            </Link>

            <Link
              href="/profile?tab=bets"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <History className="w-5 h-5" />
              <span className="text-sm font-medium">Bet History</span>
            </Link>

            <Link
              href="/profile?tab=settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
