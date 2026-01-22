/**
 * API Service for communicating with backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  // Build headers object
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers if provided
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Pragmatic Play API
export const pragmaticApi = {
  /**
   * Get list of available games
   */
  async getGames() {
    return apiRequest<{ success: boolean; games: Record<string, unknown>[]; count: number }>('/pragmatic/games');
  },

  /**
   * Launch a game
   */
  async launchGame(gameId: string, options?: {
    currency?: string;
    language?: string;
    country?: string;
    platform?: string;
  }) {
    return apiRequest<{ success: boolean; gameUrl: string; token: string; sessionId: string }>(
      '/pragmatic/launch',
      {
        method: 'POST',
        body: JSON.stringify({
          gameId,
          ...options,
        }),
      }
    );
  },
};


