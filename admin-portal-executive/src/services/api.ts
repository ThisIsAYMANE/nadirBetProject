import { User, Broker, Transaction } from '../types';

// Use local backend by default; set VITE_API_URL only when pointing to another host (e.g. ngrok for sharing)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleRateLimit(response: Response) {
    if (response.status === 429) {
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
      return true; // Indicates retry needed
    }
    return false;
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Users
  async getUsers(page = 1, limit = 10, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    const response = await fetch(`${API_BASE_URL}/users?${params}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    
    // Map backend field names to frontend User interface
    return {
      ...data,
      data: data.data.map((user: any) => ({
        id: user.user_id || user.id,
        name: user.name || user.full_name,
        email: user.email,
        role: user.role || user.user_type,
        status: user.status,
        createdAt: user.created_at || user.createdAt,
        lastLogin: user.last_login || user.lastLogin,
        totalPoints: user.total_points || user.totalPoints || 0,
        avatar: user.avatar
      }))
    };
  }

  async getUserById(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async createUser(userData: Omit<User, 'id'>) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Create user error:', response.status, errorData);
      throw new Error(`Failed to create user: ${errorData.error || response.statusText}`);
    }
    return response.json();
  }

  async updateUser(id: string, userData: Partial<User>) {
    console.log('Sending update request:', { id, userData, url: `${API_BASE_URL}/users/${id}` });
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Update user error:', response.status, errorData);
      throw new Error(`Failed to update user: ${errorData.error || response.statusText}`);
    }
    return response.json();
  }

  async deleteUser(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  }


  // Brokers
  async getBrokers(page = 1, limit = 10, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    const response = await fetch(`${API_BASE_URL}/brokers?${params}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Get brokers error:', response.status, errorData);
      throw new Error(errorData.error || 'Failed to fetch brokers');
    }
    const data = await response.json();
    console.log('Brokers API response:', data);
    return data;
  }

  async getBrokerById(id: string) {
    const response = await fetch(`${API_BASE_URL}/brokers/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }


  // Transactions
  async getTransactions(page = 1, limit = 10, filters: Record<string, string | number | boolean> = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>),
    });
    const response = await fetch(`${API_BASE_URL}/transactions?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async getTransactionById(id: string) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async updateTransaction(id: string, transactionData: Partial<Transaction>) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transactionData),
    });
    return response.json();
  }

  // KPIs
  async getKPIs(dashboardType: 'super_admin' | 'broker', brokerId?: string) {
    const params = new URLSearchParams({
      type: dashboardType,
      ...(brokerId && { brokerId }),
    });
    
    let response = await fetch(`${API_BASE_URL}/kpis?${params}`, {
      headers: this.getAuthHeaders(),
    });
    
    // Handle rate limiting with retry
    if (await this.handleRateLimit(response)) {
      response = await fetch(`${API_BASE_URL}/kpis?${params}`, {
        headers: this.getAuthHeaders(),
      });
    }
    
    if (!response.ok) throw new Error('Failed to fetch KPIs');
    return response.json();
  }

  // Charts
  async getChartData(type: string, period = '12months', brokerId?: string) {
    const params = new URLSearchParams({
      type,
      period,
      ...(brokerId && { brokerId }),
    });
    
    let response = await fetch(`${API_BASE_URL}/charts?${params}`, {
      headers: this.getAuthHeaders(),
    });
    
    // Handle rate limiting with retry
    if (await this.handleRateLimit(response)) {
      response = await fetch(`${API_BASE_URL}/charts?${params}`, {
        headers: this.getAuthHeaders(),
      });
    }
    
    if (!response.ok) throw new Error('Failed to fetch chart data');
    return response.json();
  }

  // Dashboard Data
  async getDashboardData(dashboardType: 'super_admin' | 'broker', brokerId?: string) {
    const params = new URLSearchParams({
      type: dashboardType,
      ...(brokerId && { brokerId }),
    });
    
    let response = await fetch(`${API_BASE_URL}/dashboard?${params}`, {
      headers: this.getAuthHeaders(),
    });
    
    // Handle rate limiting with retry
    if (await this.handleRateLimit(response)) {
      response = await fetch(`${API_BASE_URL}/dashboard?${params}`, {
        headers: this.getAuthHeaders(),
      });
    }
    
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  }

  // Broker Management
  async createBroker(broker: Omit<Broker, 'id'>) {
    const response = await fetch(`${API_BASE_URL}/brokers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(broker),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Create broker error:', response.status, errorData);
      throw new Error(errorData.error || errorData.errors?.[0]?.msg || 'Failed to create broker');
    }
    return response.json();
  }

  async updateBroker(id: string, broker: Partial<Broker>) {
    const response = await fetch(`${API_BASE_URL}/brokers/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(broker),
    });
    if (!response.ok) throw new Error('Failed to update broker');
    return response.json();
  }

  async deleteBroker(id: string) {
    const response = await fetch(`${API_BASE_URL}/brokers/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete broker');
    return response.json();
  }

  // Points Management
  async getPointsBalance() {
    const response = await fetch(`${API_BASE_URL}/points/balance`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  }

  async getPointsStats() {
    const response = await fetch(`${API_BASE_URL}/points/stats`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  async getPointsHistory(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/points/history?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  }

  async getPointsAllocations(type = 'all') {
    const response = await fetch(`${API_BASE_URL}/points/allocations?type=${type}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch allocations');
    return response.json();
  }

  async allocatePoints(toUserId: string, amount: number, notes = '') {
    const response = await fetch(`${API_BASE_URL}/points/allocate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ toUserId, amount, notes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to allocate points');
    }
    return response.json();
  }

  async requestPoints(requestedFromId: string, amount: number, message = '') {
    const response = await fetch(`${API_BASE_URL}/points/request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ requestedFromId, amount, message }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request points');
    }
    return response.json();
  }

  async getPointsRequests(type = 'all') {
    const response = await fetch(`${API_BASE_URL}/points/requests?type=${type}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch requests');
    return response.json();
  }

  async respondToPointsRequest(requestId: string, status: 'approved' | 'rejected', message = '') {
    const response = await fetch(`${API_BASE_URL}/points/requests/${requestId}/respond`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, message }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to respond to request');
    }
    return response.json();
  }

  async getPointsHierarchy(rootUserId?: string) {
    const params = rootUserId ? `?rootUserId=${rootUserId}` : '';
    const response = await fetch(`${API_BASE_URL}/points/hierarchy${params}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch hierarchy');
    return response.json();
  }

  // Real-time updates
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async subscribeToUpdates(callback: (data: unknown) => void) {
    // For now, return a no-op function since we don't have real-time updates set up
    // In a real application, this would be WebSocket or Server-Sent Events
    console.log('Real-time updates not implemented yet');
    return () => {};
  }
}

export const apiService = new ApiService();
