'use client';

import { useState, useEffect } from 'react';
import { Send, TrendingUp, DollarSign, Clock, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PointsStats {
  balance: number;
  totalPurchased: number;
  totalUsedBetting: number;
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
  points_requested: number;
  status: string;
  request_message: string;
  response_message?: string;
  created_at: string;
}

export default function PointsTab() {
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
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsRes, historyRes, requestsRes] = await Promise.all([
        fetch('http://localhost:3001/api/points/stats', { headers }),
        fetch('http://localhost:3001/api/points/history?limit=10', { headers }),
        fetch('http://localhost:3001/api/points/requests?type=sent', { headers })
      ]);

      if (statsRes.ok && historyRes.ok && requestsRes.ok) {
        const [statsData, historyData, requestsData] = await Promise.all([
          statsRes.json(),
          historyRes.json(),
          requestsRes.json()
        ]);

        setStats(statsData);
        setHistory(historyData.history || []);
        setRequests(requestsData.sent || []);
      }
    } catch (err) {
      console.error('Error loading points:', err);
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
      const parentId = user.parent_id || user.broker_id;

      if (!parentId) {
        throw new Error('No broker found to request from');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading points...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Coins className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-400">Current Balance</h3>
            </div>
            <p className="text-3xl font-bold text-green-500">{stats.balance.toLocaleString()}</p>
            <button
              onClick={() => setShowRequestModal(true)}
              className="mt-3 w-full bg-green-500 hover:bg-green-600 text-black py-2 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Request More
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-400">Total Received</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalPurchased.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-400">Used in Bets</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalUsedBetting.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-400">Pending Requests</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.pendingRequestsCount}</p>
          </div>
        </div>
      )}

      {/* My Requests */}
      {requests.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">My Requests</h3>
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.request_id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {request.points_requested.toLocaleString()} points
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    request.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                {request.request_message && (
                  <p className="text-sm text-gray-400 mb-1">"{request.request_message}"</p>
                )}
                {request.response_message && (
                  <p className="text-sm text-gray-300 italic">Response: "{request.response_message}"</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.ledger_id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {item.points_change > 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-white font-medium text-sm">
                    {item.description || item.transaction_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${item.points_change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.points_change > 0 ? '+' : ''}{item.points_change.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {item.balance_after.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-gray-400 py-8">No transactions yet</p>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
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
                <label className="block text-sm font-medium text-white mb-2">Amount *</label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  placeholder="Enter points amount..."
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Message (optional)</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
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
