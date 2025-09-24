import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Broker } from '../../types';
import { MoreHorizontal, Eye, Edit, TrendingUp } from 'lucide-react';

interface BrokerManagementTableProps {
  brokers: Broker[];
  title: string;
}

export const BrokerManagementTable: React.FC<BrokerManagementTableProps> = ({ brokers, title }) => {
  const getStatusVariant = (status: Broker['status']) => {
    return status === 'active' ? 'success' : 'warning';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">Monitor and manage broker performance</p>
      </div>

      <div className="overflow-x-auto">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-400">Broker</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Users</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Transactions</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Revenue</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Performance</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker, index) => (
                <tr 
                  key={broker.id}
                  className={index % 2 === 0 ? 'bg-dark-bg/30' : ''}
                >
                  <td className="py-3">
                    <div>
                      <div className="text-sm font-medium text-white">{broker.name}</div>
                      <div className="text-sm text-gray-400">{broker.email}</div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-white font-medium">
                    {broker.totalUsers.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-white">
                    {broker.totalTransactions.toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-accent-green font-semibold">
                    ${broker.revenue.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getPerformanceColor(broker.performanceScore)}`}>
                        {broker.performanceScore}%
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={getStatusVariant(broker.status)} size="sm">
                      {broker.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {brokers.map((broker) => (
            <div key={broker.id} className="bg-dark-bg/30 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-white">{broker.name}</div>
                  <div className="text-sm text-gray-400">{broker.email}</div>
                </div>
                <Badge variant={getStatusVariant(broker.status)} size="sm">
                  {broker.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-400">Users</div>
                  <div className="text-sm font-medium text-white">
                    {broker.totalUsers.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Revenue</div>
                  <div className="text-sm font-semibold text-accent-green">
                    ${broker.revenue.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Transactions</div>
                  <div className="text-sm font-medium text-white">
                    {broker.totalTransactions.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Performance</div>
                  <div className={`text-sm font-medium ${getPerformanceColor(broker.performanceScore)}`}>
                    {broker.performanceScore}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};