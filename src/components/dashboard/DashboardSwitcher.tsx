import React from 'react';
import { Button } from '../ui/Button';
import { Shield, UserCheck } from 'lucide-react';
import { DashboardType } from '../../types';

interface DashboardSwitcherProps {
  currentType: DashboardType['type'];
  onSwitch: (type: DashboardType['type']) => void;
}

export const DashboardSwitcher: React.FC<DashboardSwitcherProps> = ({
  currentType,
  onSwitch,
}) => {
  return (
    <div className="fixed bottom-4 right-20 z-50">
      <div className="bg-card-bg rounded-lg p-2 shadow-lg border border-gray-600">
        <p className="text-xs text-gray-400 mb-2 px-2">Switch Dashboard</p>
        <div className="flex space-x-2">
          <Button
            variant={currentType === 'super_admin' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onSwitch('super_admin')}
            className="flex items-center space-x-1"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Super Admin</span>
          </Button>
          <Button
            variant={currentType === 'broker' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onSwitch('broker')}
            className="flex items-center space-x-1"
          >
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Broker</span>
          </Button>
        </div>
      </div>
    </div>
  );
};