import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { Plus, TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, Send, CheckCircle, XCircle } from 'lucide-react';

interface PointsStats {
  balance: number;
  allocated: number;
  available: number;
  totalPurchased: number;
  totalUsedBetting: number;
  totalCashedOut: number;
  allocationsGivenCount: number;
  allocationsGivenTotal: number;
  allocationsReceivedCount: number;
  allocationsReceivedTotal: number;
  pendingRequestsCount: number;
}

interface Allocation {
  allocation_id: string;
  from_user_id: string;
  to_user_id: string;
  points_allocated: number;
  points_used: number;
  points_remaining: number;
  allocation_date: string;
  status: string;
  recipient_name?: string;
  recipient_role?: string;
  recipient_email?: string;
}

interface PointsRequest {
  request_id: string;
  requester_id: string;
  requester_name: string;
  requester_role: string;
  requester_email: string;
  points_requested: number;
  request_message: string;
  status: string;
  created_at: string;
}

interface HierarchyUser {
  user_id: string;
  username: string;
  full_name: string;
  user_type: string;
  status: string;
  current_balance: number;
  allocated_to_others: number;
  available: number;
  parent_name?: string;
}

export const PointsManagement: React.FC = () => {
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [requests, setRequests] = useState<PointsRequest[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HierarchyUser | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateNotes, setAllocateNotes] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, allocationsData, requestsData, hierarchyData] = await Promise.all([
        apiService.getPointsStats(),
        apiService.getPointsAllocations('all'),
        apiService.getPointsRequests('received'),
        apiService.getPointsHierarchy()
      ]);

      setStats(statsData);
      setAllocations(allocationsData.given || []);
      setRequests(requestsData.received || []);
      setHierarchy(hierarchyData.hierarchy || []);
    } catch (err) {
      console.error('Error loading points data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedUser || !allocateAmount) return;

    try {
      setAllocating(true);
      setError(null);

      await apiService.allocatePoints(selectedUser.user_id, parseInt(allocateAmount), allocateNotes);
      
      setShowAllocateModal(false);
      setSelectedUser(null);
      setAllocateAmount('');
      setAllocateNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allocate points');
    } finally {
      setAllocating(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await apiService.respondToPointsRequest(requestId, 'approved', 'Request approved');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await apiService.respondToPointsRequest(requestId, 'rejected', 'Request rejected');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-red-500';
      case 'super_admin': return 'text-purple-500';
      case 'admin': return 'text-yellow-500';
      case 'broker': return 'text-blue-500';
      case 'regular_user': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-4"></div>
          <p className="text-white">Loading points data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Points Management</h2>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card-bg border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Balance</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.balance.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-accent-green opacity-50" />
            </div>
          </Card>

          <Card className="bg-card-bg border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Available</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {stats.available.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-card-bg border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Allocated</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">
                  {stats.allocated.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-yellow-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-card-bg border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Requests</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">
                  {stats.pendingRequestsCount}
                </p>
              </div>
              <Send className="w-12 h-12 text-blue-400 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Pending Requests */}
      {requests.length > 0 && (
        <Card className="bg-card-bg border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Pending Requests</h3>
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.request_id} className="flex items-center justify-between bg-dark-bg p-4 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{request.requester_name}</span>
                    <Badge className={`${getRoleColor(request.requester_role)}`}>
                      {request.requester_role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Requesting: <span className="text-accent-green font-bold">{request.points_requested.toLocaleString()}</span> points
                  </p>
                  {request.request_message && (
                    <p className="text-sm text-gray-300 mt-1 italic">"{request.request_message}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveRequest(request.request_id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(request.request_id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hierarchy View */}
      <Card className="bg-card-bg border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Points Hierarchy</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Balance</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Allocated</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Available</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hierarchy.map((user) => (
                <tr key={user.user_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">{user.full_name || user.username}</p>
                      <p className="text-sm text-gray-400">{user.username}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={`${getRoleColor(user.user_type)}`}>
                      {user.user_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="text-right py-3 px-4">
                    <p className="text-white font-mono">{(user.current_balance || 0).toLocaleString()}</p>
                  </td>
                  <td className="text-right py-3 px-4">
                    <p className="text-yellow-400 font-mono">{(user.allocated_to_others || 0).toLocaleString()}</p>
                  </td>
                  <td className="text-right py-3 px-4">
                    <p className="text-green-400 font-mono font-bold">{(user.available || 0).toLocaleString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={
                      user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }>
                      {user.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="text-center py-3 px-4">
                    {user.user_type !== 'owner' && user.status === 'active' && (
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAllocateModal(true);
                        }}
                        size="sm"
                        className="bg-accent-green text-primary-green"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Allocate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Allocations */}
      <Card className="bg-card-bg border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Allocations</h3>
        <div className="space-y-3">
          {allocations.slice(0, 10).map((allocation) => (
            <div key={allocation.allocation_id} className="flex items-center justify-between bg-dark-bg p-4 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{allocation.recipient_name || 'Unknown'}</span>
                  <Badge className={`${getRoleColor(allocation.recipient_role || '')}`}>
                    {(allocation.recipient_role || '').replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-400">
                    Allocated: <span className="text-accent-green font-bold">{allocation.points_allocated.toLocaleString()}</span>
                  </span>
                  <span className="text-gray-400">
                    Used: <span className="text-yellow-400">{allocation.points_used.toLocaleString()}</span>
                  </span>
                  <span className="text-gray-400">
                    Remaining: <span className="text-green-400">{allocation.points_remaining.toLocaleString()}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(allocation.allocation_date).toLocaleString()}
                </p>
              </div>
              <Badge className={
                allocation.status === 'active' ? 'bg-green-500/20 text-green-400' :
                allocation.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }>
                {allocation.status.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Allocation Modal */}
      {showAllocateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card-bg border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Allocate Points</h3>
            
            <div className="space-y-4">
              <div className="bg-dark-bg p-4 rounded-lg">
                <p className="text-sm text-gray-400">Allocating to:</p>
                <p className="text-white font-medium">{selectedUser.full_name || selectedUser.username}</p>
                <Badge className={`${getRoleColor(selectedUser.user_type)} mt-2`}>
                  {selectedUser.user_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {stats && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-blue-400">
                    Your Available: <span className="font-bold">{stats.available.toLocaleString()}</span> points
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount *</label>
                <input
                  type="number"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-green"
                  placeholder="Enter points amount"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  value={allocateNotes}
                  onChange={(e) => setAllocateNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-green"
                  placeholder="Add notes about this allocation..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAllocateModal(false);
                    setSelectedUser(null);
                    setAllocateAmount('');
                    setAllocateNotes('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAllocate}
                  disabled={allocating || !allocateAmount || parseInt(allocateAmount) <= 0}
                  className="bg-accent-green text-primary-green disabled:opacity-50"
                >
                  {allocating ? 'Allocating...' : 'Allocate Points'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
