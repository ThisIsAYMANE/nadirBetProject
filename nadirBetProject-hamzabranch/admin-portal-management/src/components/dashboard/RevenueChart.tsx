import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { ChartData } from '../../types';

interface RevenueChartProps {
  data: ChartData[];
  title: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, title }) => {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">Last 12 months performance</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatValue}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a2b22', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [formatValue(value), 'Revenue']}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#00ff87" 
              strokeWidth={3}
              dot={{ fill: '#00ff87', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#00ff87', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};