import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { DashboardType } from '../../types';

interface HeaderProps {
  onMenuClick: () => void;
  dashboardType: DashboardType['type'];
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, dashboardType }) => {
  return (
    <header className="bg-dark-bg border-b border-gray-700 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-card-bg border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-accent-green"
              />
            </div>
          </div>
        </div>


        {/* Right side */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};