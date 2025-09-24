import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Transaction } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  title: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, title }) => {
  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'text-green-500';
      case 'withdrawal':
        return 'text-red-500';
      case 'bet':
        return 'text-blue-500';
      case 'win':
        return 'text-accent-green';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">Recent transaction activity</p>
      </div>

      <div className="overflow-x-auto">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Points</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr 
                  key={transaction.id}
                  className={index % 2 === 0 ? 'bg-dark-bg/30' : ''}
                >
                  <td className="py-3 text-sm text-white">{transaction.userName}</td>
                  <td className={`py-3 text-sm font-medium ${getTypeColor(transaction.type)}`}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </td>
                  <td className="py-3 text-sm text-white">${transaction.amount.toLocaleString()}</td>
                  <td className="py-3 text-sm text-accent-green">{transaction.points.toLocaleString()}</td>
                  <td className="py-3">
                    <Badge variant={getStatusVariant(transaction.status)} size="sm">
                      {transaction.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-400">
                    {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-dark-bg/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{transaction.userName}</span>
                <Badge variant={getStatusVariant(transaction.status)} size="sm">
                  {transaction.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </span>
                <span className="text-white font-semibold">${transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-accent-green">{transaction.points.toLocaleString()} pts</span>
                <span className="text-gray-400">
                  {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};