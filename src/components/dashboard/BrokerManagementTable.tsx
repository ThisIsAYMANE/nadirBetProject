import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Broker } from '../../types';
import { MoreHorizontal, Eye, Edit, TrendingUp, Plus, Trash2, Save, X } from 'lucide-react';
import { apiService } from '../../services/api';

interface BrokerManagementTableProps {
  brokers: Broker[];
  title: string;
  onRefresh?: () => void;
}

export const BrokerManagementTable: React.FC<BrokerManagementTableProps> = ({ brokers, title, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [editingBroker, setEditingBroker] = useState<Partial<Broker>>({});
  const [loading, setLoading] = useState(false);

  const getStatusVariant = (status: Broker['status']) => {
    return status === 'active' ? 'success' : 'warning';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleCreateBroker = () => {
    setModalType('create');
    setSelectedBroker(null);
    setEditingBroker({
      name: '',
      email: '',
      password: '',
      status: 'active',
      totalUsers: 0,
      totalTransactions: 0,
      revenue: 0,
      performanceScore: 0,
    });
    setShowModal(true);
  };

  const handleEditBroker = (broker: Broker) => {
    setModalType('edit');
    setSelectedBroker(broker);
    setEditingBroker(broker);
    setShowModal(true);
  };

  const handleViewBroker = (broker: Broker) => {
    setModalType('view');
    setSelectedBroker(broker);
    setShowModal(true);
  };

  const handleDeleteBroker = async (brokerId: string) => {
    if (!confirm('Are you sure you want to delete this broker?')) return;
    
    try {
      setLoading(true);
      await apiService.deleteBroker(brokerId);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting broker:', error);
      alert('Failed to delete broker');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBroker = async () => {
    try {
      setLoading(true);
      if (modalType === 'create') {
        // Validate required fields
        if (!editingBroker.name || !editingBroker.email || !editingBroker.password) {
          alert('Please fill in all required fields (Name, Email, Password)');
          setLoading(false);
          return;
        }
        
        // Prepare broker data with required fields for backend
        const brokerData = {
          name: editingBroker.name,
          email: editingBroker.email,
          password: editingBroker.password,
          businessName: editingBroker.name + ' Business', // Default business name
          commissionRate: 0.05 // Default 5% commission
        };
        console.log('Creating broker with data:', brokerData);
        await apiService.createBroker(brokerData);
        console.log('Broker created successfully');
      } else if (modalType === 'edit' && selectedBroker) {
        await apiService.updateBroker(selectedBroker.id || selectedBroker.broker_id || '', editingBroker);
      }
      setShowModal(false);
      // Wait a bit for the database to update, then refresh
      setTimeout(() => {
        console.log('Refreshing brokers list...');
        onRefresh?.();
      }, 500);
    } catch (error: any) {
      console.error('Error saving broker:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to save broker: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">Monitor and manage broker performance</p>
        </div>
        <Button
          onClick={handleCreateBroker}
          className="bg-accent-green text-primary-green hover:bg-accent-green/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Broker
        </Button>
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
                    {(broker.totalUsers || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-white">
                    {(broker.totalTransactions || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-accent-green font-semibold">
                    ${(broker.revenue || 0).toLocaleString()}
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewBroker({...broker, id: broker.id || broker.broker_id})}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditBroker({...broker, id: broker.id || broker.broker_id})}
                        title="Edit Broker"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBroker(broker.id || broker.broker_id)}
                        title="Delete Broker"
                        className="text-red-400 hover:text-red-300"
                        disabled={loading}
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
                    {(broker.totalUsers || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Revenue</div>
                  <div className="text-sm font-semibold text-accent-green">
                    ${(broker.revenue || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Transactions</div>
                  <div className="text-sm font-medium text-white">
                    {(broker.totalTransactions || 0).toLocaleString()}
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewBroker({...broker, id: broker.id || broker.broker_id})}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditBroker({...broker, id: broker.id || broker.broker_id})}
                  title="Edit Broker"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteBroker(broker.id || broker.broker_id)}
                  title="Delete Broker"
                  className="text-red-400 hover:text-red-300"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-bg rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {modalType === 'create' ? 'Add New Broker' : 
                 modalType === 'edit' ? 'Edit Broker' : 'Broker Details'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {modalType === 'view' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <div className="text-white">{selectedBroker?.name}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <div className="text-white">{selectedBroker?.email}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <Badge variant={getStatusVariant(selectedBroker?.status || 'active')} size="sm">
                    {selectedBroker?.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Total Users</label>
                  <div className="text-white">{(selectedBroker?.totalUsers || 0).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Revenue</label>
                  <div className="text-accent-green font-semibold">
                    ${(selectedBroker?.revenue || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Performance Score</label>
                  <div className={`font-medium ${getPerformanceColor(selectedBroker?.performanceScore || 0)}`}>
                    {selectedBroker?.performanceScore}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <input
                    type="text"
                    value={editingBroker.name || ''}
                    onChange={(e) => setEditingBroker({...editingBroker, name: e.target.value})}
                    className="w-full bg-dark-bg/50 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="Broker name"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <input
                    type="email"
                    value={editingBroker.email || ''}
                    onChange={(e) => setEditingBroker({...editingBroker, email: e.target.value})}
                    className="w-full bg-dark-bg/50 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="broker@example.com"
                  />
                </div>
                {modalType === 'create' && (
                  <div>
                    <label className="text-sm text-gray-400">Password</label>
                    <input
                      type="password"
                      value={editingBroker.password || ''}
                      onChange={(e) => setEditingBroker({...editingBroker, password: e.target.value})}
                      className="w-full bg-dark-bg/50 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Enter password for broker login"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <select
                    value={editingBroker.status || 'active'}
                    onChange={(e) => setEditingBroker({...editingBroker, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full bg-dark-bg/50 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Performance Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingBroker.performanceScore || 0}
                    onChange={(e) => setEditingBroker({...editingBroker, performanceScore: parseInt(e.target.value) || 0})}
                    className="w-full bg-dark-bg/50 border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="0-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              {modalType !== 'view' && (
                <Button
                  onClick={handleSaveBroker}
                  disabled={loading}
                  className="bg-accent-green text-primary-green hover:bg-accent-green/90"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {modalType === 'create' ? 'Create' : 'Save'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};