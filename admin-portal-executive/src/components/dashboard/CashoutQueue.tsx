import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle, Clock, User, DollarSign } from 'lucide-react';

interface CashoutRequest {
  request_id: string;
  user_id: string;
  broker_id: string;
  points_requested: number;
  cash_equivalent: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  payment_method?: string;
  user_name?: string;
  user_email?: string;
}

export const CashoutQueue: React.FC = () => {
  const [requests, setRequests] = useState<CashoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCashoutRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/cashout-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cashout requests');
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cashout requests');
      console.error('Cashout requests fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/cashout-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve cashout request');
      }

      // Refresh the list
      await fetchCashoutRequests();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve cashout request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(requestId);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/cashout-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject cashout request');
      }

      // Refresh the list
      await fetchCashoutRequests();
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject cashout request');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCashoutRequests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'approved':
        return 'text-green-400 bg-green-400/10';
      case 'rejected':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (loading) {
    return (
      <Card title="Cashout Queue">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-4"></div>
            <p className="text-white">Loading cashout requests...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Cashout Queue">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <Button onClick={fetchCashoutRequests}>Retry</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Cashout Queue">
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No cashout requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.request_id}
                className="bg-card-bg border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">
                          {request.user_name || `User ${request.user_id.slice(0, 8)}`}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {request.user_email || 'No email available'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">
                          ${request.cash_equivalent.toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {request.points_requested.toLocaleString()} points
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.request_id)}
                          disabled={actionLoading === request.request_id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === request.request_id ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.request_id)}
                          disabled={actionLoading === request.request_id}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          {actionLoading === request.request_id ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                    {request.payment_method && (
                      <span>Method: {request.payment_method}</span>
                    )}
                  </div>
                  {request.rejection_reason && (
                    <p className="text-red-400 text-sm mt-1">
                      Reason: {request.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
