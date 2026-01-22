import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useUsers } from '../../hooks/useDashboardData';
import { User } from '../../types';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { apiService } from '../../services/api';

interface UserManagementProps {
  title: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ title }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'regular_user' as 'owner' | 'super_admin' | 'admin' | 'broker' | 'regular_user',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    businessName: '',
    commissionRate: '0.05'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { users, loading, error, total, refresh } = useUsers(currentPage, 10, searchTerm);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleUserAction = (user: User, action: 'view' | 'edit' | 'delete') => {
    if (action === 'delete') {
      handleDeleteUser(user);
    } else {
      setSelectedUser(user);
      setModalType(action);
      if (action === 'edit') {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: user.role as 'owner' | 'super_admin' | 'admin' | 'broker' | 'regular_user',
          status: user.status as 'active' | 'inactive' | 'suspended',
          businessName: '',
          commissionRate: '0.05'
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'regular_user',
          status: 'active',
          businessName: '',
          commissionRate: '0.05'
        });
      }
      setShowModal(true);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.name}? This will make them inactive but preserve their data.`)) return;
    
    try {
      setFormLoading(true);
      setFormError(null);
      await apiService.deleteUser(user.id!);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (modalType === 'create') {
        // If creating a broker, use broker API
        if (formData.role === 'broker') {
          await apiService.createBroker({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            businessName: formData.businessName || formData.name,
            commissionRate: parseFloat(formData.commissionRate) || 0.05,
            status: formData.status,
            totalUsers: 0,
            totalTransactions: 0,
            revenue: 0,
            performanceScore: 0
          });
        } else {
          // Create regular user
          const userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            status: formData.status
          };
          await apiService.createUser(userData);
        }
      } else if (modalType === 'edit' && selectedUser) {
        // For updates, don't send password if empty
        const updateData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        };
        if (!updateData.password) {
          delete updateData.password;
        }
        await apiService.updateUser(selectedUser.id!, updateData);
      }

      setShowModal(false);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'super_admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'admin':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'broker':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'regular_user':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-4"></div>
          <p className="text-white">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading users: {error}</p>
          <Button onClick={refresh} className="bg-accent-green text-primary-green">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400">Manage and monitor user accounts</p>
        </div>
        <Button
          onClick={() => handleUserAction({} as User, 'create')}
          className="bg-accent-green text-primary-green hover:bg-accent-green/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                />
              </div>
            </div>
            <Button type="submit" className="bg-accent-green text-primary-green">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-300 font-medium">User</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Role</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Points</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Last Login</th>
                <th className="text-right py-4 px-6 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center">
                        <span className="text-accent-green font-semibold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={getStatusColor(user.status)}>
                      {user.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">
                      {user.totalPoints?.toLocaleString() || '0'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-400 text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUserAction(user, 'view')}
                        className="text-gray-400 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUserAction(user, 'edit')}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUserAction(user, 'delete')}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            Showing {users.length} of {total} users
          </p>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-gray-400 text-sm px-3">
              Page {currentPage}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={users.length < 10}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {modalType === 'create' ? 'Create User' : 
                 modalType === 'edit' ? 'Edit User' : 'User Details'}
              </h3>
              
              {modalType === 'view' && selectedUser && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <p className="text-white">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Total Points</label>
                    <p className="text-white">{selectedUser.totalPoints?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              )}

              {(modalType === 'create' || modalType === 'edit') && (
                <div className="space-y-4">
                  {formError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{formError}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                      placeholder="Enter user name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                      placeholder="Enter user email"
                      required
                    />
                  </div>

                  {modalType === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                        placeholder="Enter password (min 6 characters)"
                        required
                        minLength={6}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                      aria-label="User role selection"
                    >
                      <option value="regular_user">Regular User</option>
                      <option value="broker">Broker</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                      aria-label="User status selection"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Show broker-specific fields if role is broker */}
                {formData.role === 'broker' && modalType === 'create' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Business Name *</label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                        placeholder="e.g., ABC Gaming"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Commission Rate *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={formData.commissionRate}
                        onChange={(e) => handleInputChange('commissionRate', e.target.value)}
                        className="w-full px-3 py-2 bg-card-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                        placeholder="0.05 (5%)"
                      />
                      <p className="text-xs text-gray-400 mt-1">Enter as decimal (e.g., 0.05 for 5%)</p>
                    </div>
                  </div>
                )}
              </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </Button>
                {modalType !== 'view' && (
                  <Button 
                    onClick={handleSaveUser}
                    disabled={formLoading || !formData.name || !formData.email || (modalType === 'create' && !formData.password)}
                    className="bg-accent-green text-primary-green disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : (modalType === 'create' ? 'Create' : 'Save')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

