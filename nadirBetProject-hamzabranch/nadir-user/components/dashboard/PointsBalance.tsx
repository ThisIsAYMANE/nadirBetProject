'use client';

import { useState, useEffect } from 'react';
import { Send, History, TrendingUp, DollarSign, Clock, Coins } from 'lucide-react';

interface PointsStats {
  balance: number;
  allocated: number;
  available: number;
  totalPurchased: number;
  totalUsedBetting: number;
  totalCashedOut: number;
  pendingRequestsCount: number;
}

interface PointsHistory {
  ledger_id: string;
  transaction_type: string;
  points_change: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface PointsRequest {
  request_id: string;
  requested_from_id: string;
  requested_from_name: string;
  requested_from_role: string;
  points_requested: number;
  status: string;
  request_message: string;
  response_message?: string;
  created_at: string;
  responded_at?: string;
}

export default function PointsBalance() {
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [requests, setRequests] = useState<PointsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsRes, historyRes, requestsRes] = await Promise.all([
        fetch('http://localhost:3001/api/points/stats', { headers }),
        fetch('http://localhost:3001/api/points/history?limit=20', { headers }),
        fetch('http://localhost:3001/api/points/requests?type=sent', { headers })
      ]);

      if (!statsRes.ok || !historyRes.ok || !requestsRes.ok) {
        throw new Error('Failed to load points data');
      }

      const [statsData, historyData, requestsData] = await Promise.all([
        statsRes.json(),
        historyRes.json(),
        requestsRes.json()
      ]);

      setStats(statsData);
      setHistory(historyData.history || []);
      setRequests(requestsData.sent || []);
    } catch (err) {
      console.error('Error loading points:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPoints = async () => {
    if (!requestAmount) return;

    try {
      setRequesting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Get parent/broker ID (the person who created this user)
      const parentId = user.parent_id || user.broker_id;
      if (!parentId) {
        throw new Error('No parent user found to request from');
      }

      const response = await fetch('http://localhost:3001/api/points/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestedFromId: parentId,
          amount: parseInt(requestAmount),
          message: requestMessage
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request points');
      }

      setShowRequestModal(false);
      setRequestAmount('');
      setRequestMessage('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request points');
    } finally {
      setRequesting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'allocation_received':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'bet_placed':
      case 'bet_lost':
        return <DollarSign className="w-5 h-5 text-red-400" />;
      case 'bet_won':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      default:
        return <History className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your points...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          My Points
        </h1>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-semibold w-full sm:w-auto justify-center"
        >
          <Send className="w-4 h-4" />
          Request Points
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Balance Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm font-medium">Current Balance</span>
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-green-500">{stats.balance.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">points</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Total Received</span>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalPurchased.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Used in Bets</span>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalUsedBetting.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Pending Requests</span>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.pendingRequestsCount}</p>
          </div>
        </div>
      )}

      {/* My Requests */}
      {requests.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">My Requests</h2>
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.request_id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        Requested: {request.points_requested.toLocaleString()} points
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    {request.request_message && (
                      <p className="text-sm text-gray-400 mt-1">Message: "{request.request_message}"</p>
                    )}
                    {request.response_message && (
                      <p className="text-sm text-gray-300 mt-1 italic">Response: "{request.response_message}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.ledger_id} className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                {getTransactionIcon(item.transaction_type)}
                <div>
                  <p className="text-white font-medium">
                    {item.description || item.transaction_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${item.points_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.points_change > 0 ? '+' : ''}{item.points_change.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Balance: {item.balance_after.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-gray-400 py-8">No transaction history yet</p>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Request Points
            </h3>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Enter points amount..."
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Why do you need these points?..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestAmount('');
                    setRequestMessage('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPoints}
                  disabled={requesting || !requestAmount || parseInt(requestAmount) <= 0}
                  className="bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {requesting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
