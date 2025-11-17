'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { User, Wallet, History, Settings, Star, Trophy, MessageCircle, DollarSign, Send, Clock } from 'lucide-react';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [cashoutAmount, setCashoutAmount] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
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
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">John Doe</h1>
                <p className="text-gray-400 mb-2 text-sm sm:text-base">Member since January 2024</p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-semibold text-sm sm:text-base">$1,247.50</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-white text-sm sm:text-base">Level 3</span>
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
              {/* Stats Cards */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Total Bets</h3>
                </div>
                <p className="text-3xl font-bold text-green-500">127</p>
                <p className="text-gray-400 text-sm mt-2">+12 this month</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Total Winnings</h3>
                </div>
                <p className="text-3xl font-bold text-blue-500">$3,456</p>
                <p className="text-gray-400 text-sm mt-2">+$234 this month</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Star className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Win Rate</h3>
                </div>
                <p className="text-3xl font-bold text-purple-500">67%</p>
                <p className="text-gray-400 text-sm mt-2">+5% this month</p>
              </div>

              {/* Recent Activity */}
              <div className="md:col-span-2 lg:col-span-3 bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Won bet on Lakers vs Warriors', amount: '+$150', time: '2 hours ago', type: 'win' },
                    { action: 'Placed bet on Man Utd vs Liverpool', amount: '-$50', time: '5 hours ago', type: 'bet' },
                    { action: 'Lost bet on Chiefs vs Ravens', amount: '-$75', time: '1 day ago', type: 'loss' },
                    { action: 'Won jackpot on Mega Moolah', amount: '+$2,500', time: '2 days ago', type: 'jackpot' }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{activity.action}</p>
                        <p className="text-gray-400 text-sm">{activity.time}</p>
                      </div>
                      <span className={`font-bold ${
                        activity.type === 'win' || activity.type === 'jackpot' ? 'text-green-500' :
                        activity.type === 'loss' ? 'text-red-500' : 'text-gray-300'
                      }`}>
                        {activity.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bets' && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bet History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 text-gray-400">Date</th>
                      <th className="text-left py-3 text-gray-400">Event</th>
                      <th className="text-left py-3 text-gray-400">Bet</th>
                      <th className="text-left py-3 text-gray-400">Odds</th>
                      <th className="text-left py-3 text-gray-400">Stake</th>
                      <th className="text-left py-3 text-gray-400">Status</th>
                      <th className="text-left py-3 text-gray-400">Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        date: '2025-01-15',
                        event: 'Lakers vs Warriors',
                        bet: 'Lakers to Win',
                        odds: '1.85',
                        stake: '$100',
                        status: 'won',
                        payout: '$185'
                      },
                      {
                        date: '2025-01-14',
                        event: 'Man Utd vs Liverpool',
                        bet: 'Over 2.5 Goals',
                        odds: '1.70',
                        stake: '$50',
                        status: 'pending',
                        payout: '-'
                      },
                      {
                        date: '2025-01-13',
                        event: 'Chiefs vs Ravens',
                        bet: 'Chiefs -3.5',
                        odds: '1.95',
                        stake: '$75',
                        status: 'lost',
                        payout: '$0'
                      }
                    ].map((bet, i) => (
                      <tr key={i} className="border-b border-gray-700">
                        <td className="py-3 text-white">{bet.date}</td>
                        <td className="py-3 text-white">{bet.event}</td>
                        <td className="py-3 text-white">{bet.bet}</td>
                        <td className="py-3 text-white">{bet.odds}</td>
                        <td className="py-3 text-white">{bet.stake}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            bet.status === 'won' ? 'bg-green-500/20 text-green-500' :
                            bet.status === 'lost' ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {bet.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-white">{bet.payout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    <label className="block text-white font-medium mb-2">Available Balance</label>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <span className="text-2xl font-bold text-green-500">$1,247.50</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Cashout Amount</label>
                    <input
                      type="number"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Payment Method</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none">
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
                    { date: '2025-01-14', amount: '$500.00', method: 'Bank Transfer', status: 'completed' },
                    { date: '2025-01-10', amount: '$250.00', method: 'PayPal', status: 'completed' },
                    { date: '2025-01-08', amount: '$100.00', method: 'Skrill', status: 'pending' }
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

          {/* Other tabs would go here... */}
        </main>
      </div>
    </div>
  );
}