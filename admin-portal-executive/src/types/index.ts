export type UserRole = 'owner' | 'super_admin' | 'admin' | 'broker' | 'regular_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
  totalPoints: number;
  avatar?: string;
}

export interface Broker {
  id?: string; // Optional for database responses
  broker_id?: string; // Database field name
  name: string;
  email: string;
  password?: string; // Optional for creation
  status: 'active' | 'inactive';
  totalUsers: number;
  totalTransactions: number;
  revenue: number;
  performanceScore: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  amount: number;
  points: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  brokerId?: string;
}

export interface KPIData {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface DashboardType {
  type: 'super_admin' | 'broker';
}