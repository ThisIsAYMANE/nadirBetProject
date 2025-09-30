import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { KPICard } from './components/dashboard/KPICard';
import { RevenueChart } from './components/dashboard/RevenueChart';
import { TransactionTable } from './components/dashboard/TransactionTable';
import { UserManagement } from './components/dashboard/UserManagement';
import { BrokerManagementTable } from './components/dashboard/BrokerManagementTable';
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardType } from './types';

const DashboardApp: React.FC = () => {
  const { user, isAuthenticated, isLoading, dashboardType, setDashboardType } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  // Get real-time dashboard data only when authenticated
  const { data, loading, error, refresh } = useDashboardData({
    dashboardType,
    brokerId: user?.role === 'broker' ? user.id : undefined,
    autoRefresh: isAuthenticated,
  });

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (item: string) => {
    setActiveItem(item);
    setSidebarOpen(false);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderDashboardContent = () => {
    // Show loading only if we're authenticated and actually loading
    if (isAuthenticated && loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-4"></div>
            <p className="text-white">Loading dashboard data...</p>
          </div>
        </div>
      );
    }

    // Show error only if we're authenticated and there's an error
    if (isAuthenticated && error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error loading data: {error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-accent-green text-primary-green rounded-lg hover:bg-accent-green/90"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (activeItem === 'dashboard') {
      // Fallback data when no data is available yet
      const fallbackKPIs = [
        { title: 'Total Revenue', value: '$0', change: 0, trend: 'stable' as const },
        { title: 'Active Users', value: '0', change: 0, trend: 'stable' as const },
        { title: 'Transactions', value: '0', change: 0, trend: 'stable' as const },
        { title: 'Success Rate', value: '0%', change: 0, trend: 'stable' as const },
      ];

      const fallbackChartData = [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
      ];

      return (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(data.kpis.length > 0 ? data.kpis : fallbackKPIs).map((kpi, index) => (
              <KPICard key={index} data={kpi} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart 
              data={data.revenueChart.length > 0 ? data.revenueChart : fallbackChartData} 
              title={dashboardType === 'super_admin' ? 'Platform Revenue' : 'Broker Earnings'}
            />
            <RevenueChart 
              data={data.performanceChart.length > 0 ? data.performanceChart : fallbackChartData} 
              title="Recent Performance"
            />
          </div>

          {/* Transactions */}
          <TransactionTable 
            transactions={data.transactions.length > 0 ? data.transactions.slice(0, 10) : []} 
            title="Recent Transactions" 
          />
        </div>
      );
    }

    if (activeItem === 'brokers' && dashboardType === 'super_admin') {
      return (
        <div className="space-y-6">
          <BrokerManagementTable 
            brokers={data.brokers.length > 0 ? data.brokers : []} 
            title="Broker Management"
            onRefresh={refresh}
          />
        </div>
      );
    }

    if (activeItem === 'users') {
      return (
        <UserManagement 
          title={dashboardType === 'super_admin' ? 'User Monitoring' : 'User Management'}
        />
      );
    }

    if (activeItem === 'transactions') {
      const fallbackChartData = [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
      ];

      return (
        <div className="space-y-6">
          <TransactionTable 
            transactions={data.transactions.length > 0 ? data.transactions : []} 
            title="Transaction History" 
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart 
              data={data.revenueChart.length > 0 ? data.revenueChart.slice(0, 6) : fallbackChartData} 
              title="Transaction Volume"
            />
            <RevenueChart 
              data={data.performanceChart.length > 0 ? data.performanceChart : fallbackChartData} 
              title="Processing Times"
            />
          </div>
        </div>
      );
    }

    if (activeItem === 'analytics') {
      const fallbackKPIs = [
        { title: 'Total Revenue', value: '$0', change: 0, trend: 'stable' as const },
        { title: 'Active Users', value: '0', change: 0, trend: 'stable' as const },
        { title: 'Transactions', value: '0', change: 0, trend: 'stable' as const },
        { title: 'Success Rate', value: '0%', change: 0, trend: 'stable' as const },
      ];

      const fallbackChartData = [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
      ];

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(data.kpis.length > 0 ? data.kpis : fallbackKPIs).map((kpi, index) => (
              <KPICard key={index} data={kpi} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart 
              data={data.revenueChart.length > 0 ? data.revenueChart : fallbackChartData} 
              title="Performance Analytics"
            />
            <RevenueChart 
              data={data.performanceChart.length > 0 ? data.performanceChart : fallbackChartData} 
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

    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}

export default App;