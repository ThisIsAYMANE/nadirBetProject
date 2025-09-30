import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { User } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';

interface UserManagementTableProps {
  users: User[];
  title: string;
  showActions?: boolean;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ 
  users, 
  title,
  showActions = true 
}) => {
  const getStatusVariant = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'info';
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'super_admin':
        return 'text-purple-500';
      case 'broker':
        return 'text-blue-500';
      case 'regular_user':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">Manage user accounts and permissions</p>
      </div>

      <div className="overflow-x-auto">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Points</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 text-sm font-medium text-gray-400">Last Login</th>
                {showActions && <th className="text-left py-3 text-sm font-medium text-gray-400">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr 
                  key={user.id}
                  className={index % 2 === 0 ? 'bg-dark-bg/30' : ''}
                >
                  <td className="py-3">
                    <div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className={`py-3 text-sm font-medium ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="py-3 text-sm text-accent-green font-semibold">
                    {(user.totalPoints || 0).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <Badge variant={getStatusVariant(user.status)} size="sm">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-400">
                    {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                  </td>
                  {showActions && (
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-dark-bg/30 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
                <Badge variant={getStatusVariant(user.status)} size="sm">
                  {user.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-400">Role</div>
                  <div className={`text-sm font-medium ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Points</div>
                  <div className="text-sm font-semibold text-accent-green">
                    {(user.totalPoints || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Last login: {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                </div>
                {showActions && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};