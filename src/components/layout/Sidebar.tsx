import React from 'react';
import { 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  UserCheck,
  DollarSign,
  Activity,
  Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardType } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  dashboardType: DashboardType['type'];
  activeItem: string;
  onItemClick: (item: string) => void;
}

const superAdminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'brokers', label: 'Broker Management', icon: UserCheck },
  { id: 'users', label: 'User Monitoring', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'system', label: 'System Health', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const brokerNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'cashouts', label: 'Cashout Queue', icon: DollarSign },
  { id: 'analytics', label: 'Performance', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  dashboardType,
  activeItem,
  onItemClick,
}) => {
  const navItems = dashboardType === 'super_admin' ? superAdminNavItems : brokerNavItems;

  return (
    <div
      className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-primary-green transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        {
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen,
        }
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-primary-green/20">
          <Shield className="h-8 w-8 text-accent-green mr-2" />
          <span className="text-xl font-bold text-white">
            {dashboardType === 'super_admin' ? 'BetAdmin Pro' : 'BetBroker'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={clsx(
                  'flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors',
                  {
                    'bg-accent-green text-primary-green font-medium': activeItem === item.id,
                    'text-gray-300 hover:bg-primary-green/50 hover:text-white': activeItem !== item.id,
                  }
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="px-6 py-4 border-t border-primary-green/20">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-accent-green flex items-center justify-center">
              <span className="text-primary-green font-semibold text-sm">
                {dashboardType === 'super_admin' ? 'SA' : 'BR'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {dashboardType === 'super_admin' ? 'Super Admin' : 'Broker Admin'}
              </p>
              <p className="text-xs text-gray-300">admin@platform.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};