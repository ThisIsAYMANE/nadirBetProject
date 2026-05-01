import { User, Broker, Transaction, KPIData, ChartData } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-20T10:30:00Z',
    totalPoints: 15420,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    role: 'broker',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-20T09:15:00Z',
    totalPoints: 89350,
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike.w@email.com',
    role: 'user',
    status: 'suspended',
    createdAt: '2024-01-08',
    lastLogin: '2024-01-19T16:45:00Z',
    totalPoints: 5280,
  },
  {
    id: '4',
    name: 'Emma Davis',
    email: 'emma.davis@email.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-12',
    lastLogin: '2024-01-20T14:20:00Z',
    totalPoints: 23150,
  },
];

export const mockBrokers: Broker[] = [
  {
    id: '1',
    name: 'Premium Bets Ltd',
    email: 'contact@premiumbets.com',
    status: 'active',
    totalUsers: 1250,
    totalTransactions: 15680,
    revenue: 245780,
    performanceScore: 94,
    createdAt: '2023-08-15',
  },
  {
    id: '2',
    name: 'Global Gaming Co',
    email: 'admin@globalgaming.com',
    status: 'active',
    totalUsers: 890,
    totalTransactions: 9240,
    revenue: 156420,
    performanceScore: 87,
    createdAt: '2023-09-20',
  },
  {
    id: '3',
    name: 'Elite Sports Hub',
    email: 'info@elitesports.com',
    status: 'inactive',
    totalUsers: 450,
    totalTransactions: 3250,
    revenue: 78930,
    performanceScore: 72,
    createdAt: '2023-11-05',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Smith',
    type: 'deposit',
    amount: 500,
    points: 500,
    status: 'completed',
    timestamp: '2024-01-20T10:30:00Z',
    brokerId: '1',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Sarah Johnson',
    type: 'withdrawal',
    amount: 1200,
    points: 1200,
    status: 'pending',
    timestamp: '2024-01-20T09:15:00Z',
    brokerId: '1',
  },
  {
    id: '3',
    userId: '4',
    userName: 'Emma Davis',
    type: 'bet',
    amount: 250,
    points: 250,
    status: 'completed',
    timestamp: '2024-01-20T08:45:00Z',
    brokerId: '2',
  },
  {
    id: '4',
    userId: '1',
    userName: 'John Smith',
    type: 'win',
    amount: 750,
    points: 750,
    status: 'completed',
    timestamp: '2024-01-20T07:20:00Z',
    brokerId: '1',
  },
];

export const superAdminKPIs: KPIData[] = [
  { title: 'Total Revenue', value: '$2.4M', change: 12.5, trend: 'up' },
  { title: 'Active Brokers', value: '24', change: 8.3, trend: 'up' },
  { title: 'Total Users', value: '15.2K', change: -2.1, trend: 'down' },
  { title: 'System Health', value: '98.5%', change: 0.5, trend: 'stable' },
];

export const brokerKPIs: KPIData[] = [
  { title: 'Total Earnings', value: '$45.2K', change: 18.7, trend: 'up' },
  { title: 'Active Users', value: '1,250', change: 5.2, trend: 'up' },
  { title: 'Pending Cashouts', value: '23', change: -12.3, trend: 'down' },
  { title: 'Success Rate', value: '94.2%', change: 2.1, trend: 'up' },
];

export const chartData: ChartData[] = [
  { name: 'Jan', value: 1200000 },
  { name: 'Feb', value: 1350000 },
  { name: 'Mar', value: 1180000 },
  { name: 'Apr', value: 1480000 },
  { name: 'May', value: 1620000 },
  { name: 'Jun', value: 1750000 },
  { name: 'Jul', value: 1890000 },
  { name: 'Aug', value: 2100000 },
  { name: 'Sep', value: 2250000 },
  { name: 'Oct', value: 2180000 },
  { name: 'Nov', value: 2350000 },
  { name: 'Dec', value: 2400000 },
];

export const transactionChartData: ChartData[] = [
  { name: '00:00', value: 45 },
  { name: '04:00', value: 23 },
  { name: '08:00', value: 67 },
  { name: '12:00', value: 89 },
  { name: '16:00', value: 156 },
  { name: '20:00', value: 134 },
];