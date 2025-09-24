import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { KPICard } from './components/dashboard/KPICard';
import { RevenueChart } from './components/dashboard/RevenueChart';
import { TransactionTable } from './components/dashboard/TransactionTable';
import { UserManagementTable } from './components/dashboard/UserManagementTable';
import { BrokerManagementTable } from './components/dashboard/BrokerManagementTable';
import { DashboardSwitcher } from './components/dashboard/DashboardSwitcher';
import { DashboardType } from './types';
import {
  superAdminKPIs,
  brokerKPIs,
  chartData,
  mockTransactions,
  mockUsers,
  mockBrokers,
} from './data/mockData';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [dashboardType, setDashboardType] = useState<DashboardType['type']>('super_admin');

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (item: string) => {
    setActiveItem(item);
    setSidebarOpen(false);
  };

  const handleDashboardSwitch = (type: DashboardType['type']) => {
    setDashboardType(type);
    setActiveItem('dashboard');
  };

  const kpis = dashboardType === 'super_admin' ? superAdminKPIs : brokerKPIs;

  const renderDashboardContent = () => {
    if (activeItem === 'dashboard') {
      return (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <KPICard key={index} data={kpi} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart 
              data={chartData} 
              title={dashboardType === 'super_admin' ? 'Platform Revenue' : 'Broker Earnings'}
            />
            <RevenueChart 
              data={chartData.slice(6)} 
              title="Recent Performance"
            />
          </div>

          {/* Transactions */}
          <TransactionTable 
            transactions={mockTransactions} 
            title="Recent Transactions" 
          />
        </div>
      );
    }

    if (activeItem === 'brokers' && dashboardType === 'super_admin') {
      return (
        <div className="space-y-6">
          <BrokerManagementTable 
            brokers={mockBrokers} 
            title="Broker Management"
          />
        </div>
      );
    }

    if (activeItem === 'users') {
      return (
        <div className="space-y-6">
          <UserManagementTable 
            users={mockUsers} 
            title={dashboardType === 'super_admin' ? 'User Monitoring' : 'User Management'}
          />
        </div>
      );
    }

    if (activeItem === 'transactions') {
      return (
        <div className="space-y-6">
          <TransactionTable 
            transactions={mockTransactions} 
            title="Transaction History" 
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart 
              data={chartData.slice(0, 6)} 
              title="Transaction Volume"
            />
            <RevenueChart 
              data={chartData.slice(6)} 
              title="Processing Times"
            />
          </div>
        </div>
      );
    }

    if (activeItem === 'analytics') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <KPICard key={index} data={kpi} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart 
              data={chartData} 
              title="Performance Analytics"
            />
            <RevenueChart 
              data={chartData.slice(3, 9)} 
              title="Growth Metrics"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
          </h2>
          <p className="text-gray-400">This section is under development</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        dashboardType={dashboardType}
        activeItem={activeItem}
        onItemClick={handleSidebarItemClick}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <Header onMenuClick={handleMenuClick} dashboardType={dashboardType} />
        
        <main className="p-4 lg:p-6 min-h-screen">
          {renderDashboardContent()}
        </main>
      </div>

      {/* Dashboard Switcher */}
      <DashboardSwitcher
        currentType={dashboardType}
        onSwitch={handleDashboardSwitch}
      />
    </div>
  );
}

export default App;