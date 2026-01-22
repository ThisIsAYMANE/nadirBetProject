import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { KPIData } from '../../types';
import { clsx } from 'clsx';

interface KPICardProps {
  data: KPIData;
}

export const KPICard: React.FC<KPICardProps> = ({ data }) => {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{data.title}</p>
          <p className="text-2xl font-bold text-white">{data.value}</p>
        </div>
        <div className={clsx('flex items-center space-x-1', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {data.change > 0 ? '+' : ''}{data.change}%
          </span>
        </div>
      </div>
    </Card>
  );
};