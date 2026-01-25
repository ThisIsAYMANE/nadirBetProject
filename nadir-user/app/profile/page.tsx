'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PointsTab from '@/components/profile/PointsTab';
import { BetHistory } from '@/components/betting/BetHistory';
import CurrencySelector from '@/components/settings/CurrencySelector';
import { User, History, Settings, Star, Trophy, MessageCircle, DollarSign, Send, Clock, Coins } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [pointsBalance, setPointsBalance] = useState(0);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userCurrency, setUserCurrency] = useState<string>('EUR');

  useEffect(() => {
    // Check authentication immediately
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to home if not logged in
      router.push('/');
      return;
    }

    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    // Load user data and points
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token) return;

        // Get user info from localStorage
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.full_name || user.name || user.username || 'User');
          setUserEmail(user.email || '');
        }

        // Fetch points balance
        const pointsResponse = await fetch('http://localhost:3001/api/points/balance', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setPointsBalance(pointsData.balance || 0);
        }

        // Fetch user profile for currency
        try {
          const profileResponse = await fetch('http://localhost:3001/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.profile?.currency) {
              setUserCurrency(profileData.profile.currency);
            }
          }
        } catch (err) {
          // Profile endpoint might not exist yet, use default
          console.warn('Could not fetch profile:', err);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    loadUserData();
    // Refresh every 30 seconds
    const interval = setInterval(loadUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-400 mt-4">Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex overflow-x-hidden">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          {/* Profile Header */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{userName}</h1>
                <p className="text-gray-400 mb-2 text-sm sm:text-base">{userEmail || 'Member'}</p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-semibold text-sm sm:text-base">
                      {pointsBalance.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>
              <button className="bg-green-500 hover:bg-green-600 text-black px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'points', label: 'Points', icon: Coins },
              { id: 'bets', label: 'Bet History', icon: History },
              { id: 'favorites', label: 'Favorites', icon: Star },
              { id: 'broker', label: 'Broker Chat', icon: MessageCircle },
              { id: 'cashout', label: 'Cashout', icon: DollarSign },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-green-500 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Points Balance Card - DYNAMIC */}
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-green-500">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Coins className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Points Balance</h3>
                </div>
                <p className="text-3xl font-bold text-green-500">{pointsBalance.toLocaleString()}</p>
                <button 
                  onClick={() => setActiveTab('points')}
                  className="mt-3 text-sm text-green-500 hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  View Details →
                </button>
              </div>

              {/* Stats Cards - STATIC (until casino/sports implemented) */}
              <div className="bg-gray-800 rounded-xl p-6 opacity-60">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Total Bets</h3>
                </div>
                <p className="text-3xl font-bold text-gray-500">-</p>
                <p className="text-gray-400 text-sm mt-2">Coming soon</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 opacity-60">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Star className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Win Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-500">-</p>
                <p className="text-gray-400 text-sm mt-2">Coming soon</p>
              </div>

              {/* Recent Activity - PLACEHOLDER */}
              <div className="md:col-span-2 lg:col-span-4 bg-gray-800 rounded-xl p-6 opacity-60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">No activity yet</p>
                      <p className="text-gray-600 text-sm mt-1">Start betting to see your activity here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'points' && <PointsTab />}

          {activeTab === 'bets' && <BetHistory />}

          {activeTab === 'broker' && (
            <div className="space-y-6">
              {/* Chat Messages */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Broker Support Chat</span>
                </h3>
                
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {/* Sample messages */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-black">B</span>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 max-w-xs">
                      <p className="text-white text-sm">Hello! How can I assist you today?</p>
                      <span className="text-xs text-gray-400">2 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="bg-green-500 rounded-lg p-3 max-w-xs">
                      <p className="text-black text-sm">I need help with my recent bet settlement</p>
                      <span className="text-xs text-black/70">2 hours ago</span>
                    </div>
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-black">B</span>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 max-w-xs">
                      <p className="text-white text-sm">I'll look into that for you. Can you provide the bet ID?</p>
                      <span className="text-xs text-gray-400">1 hour ago</span>
                    </div>
                  </div>
                </div>
                
                {/* Message Input */}
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  />
                  <button className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors text-left">
                    <h4 className="text-white font-medium mb-2">Bet Settlement Issue</h4>
                    <p className="text-gray-400 text-sm">Report a problem with bet settlement</p>
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors text-left">
                    <h4 className="text-white font-medium mb-2">Account Verification</h4>
                    <p className="text-gray-400 text-sm">Get help with account verification</p>
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors text-left">
                    <h4 className="text-white font-medium mb-2">Bonus Questions</h4>
                    <p className="text-gray-400 text-sm">Ask about bonuses and promotions</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cashout' && (
            <div className="space-y-6">
              {/* Cashout Form */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Request Cashout</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Available Points</label>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <span className="text-2xl font-bold text-green-500">{pointsBalance.toLocaleString()} pts</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Cashout Points</label>
                    <input
                      type="number"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      placeholder="Enter points amount"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Payment Method</label>
                    <select
                      aria-label="Cashout payment method"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    >
                      <option>Bank Transfer</option>
                      <option>PayPal</option>
                      <option>Skrill</option>
                      <option>Neteller</option>
                    </select>
                  </div>
                  
                  <button className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded-lg font-semibold transition-colors">
                    Request Cashout
                  </button>
                </div>
              </div>
              
              {/* Cashout History */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Cashout History</span>
                </h3>
                
                <div className="space-y-3">
                  {[
                    { date: '2025-01-14', amount: '5000 pts', method: 'Bank Transfer', status: 'completed' },
                    { date: '2025-01-10', amount: '2500 pts', method: 'PayPal', status: 'completed' },
                    { date: '2025-01-08', amount: '1000 pts', method: 'Skrill', status: 'pending' }
                  ].map((cashout, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{cashout.amount}</p>
                        <p className="text-gray-400 text-sm">{cashout.date} • {cashout.method}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        cashout.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {cashout.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </h3>
                
                <CurrencySelector 
                  currentCurrency={userCurrency}
                  onCurrencyChange={(currency) => {
                    setUserCurrency(currency);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}