const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface GameFilters {
  page?: number;
  perPage?: number;
  provider?: string;
  type?: string;
  expand?: string;
  /** 'desktop' | 'mobile' – backend fetches until 50 matching so grid rows stay full */
  device?: 'desktop' | 'mobile';
}

export interface GameListResponse {
  items: CasinoGame[];
  _meta: {
    totalCount: number;
    pageCount: number;
    currentPage: number;
    perPage: number;
  };
  _links?: {
    self?: { href: string };
    next?: { href: string };
    last?: { href: string };
  };
}

export interface CasinoGame {
  uuid: string;
  name: string;
  image: string;
  type: string;
  provider: string;
  provider_id: number;
  technology: string;
  has_lobby: number; // 0 or 1
  is_mobile: number; // 0 or 1 - CRITICAL for filtering
  has_freespins: number;
  has_tables: number;
  freespin_valid_until_full_day?: number;
  label?: string;
  tags?: GameTag[];
  parameters?: GameParameters;
  images?: GameImage[];
  related_games?: CasinoGame[];
}

export interface GameTag {
  code: string;
  label: string;
  category?: {
    code: string;
    label: string;
  };
}

export interface GameParameters {
  rtp?: number;
  volatility?: string;
  reels_count?: string;
  lines_count?: number;
}

export interface GameImage {
  name: string;
  file: string;
  url: string;
  type: string;
}

export interface LaunchResponse {
  success: boolean;
  url: string;
  sessionId: string;
  gameId: string;
}

export interface RecentGamesResponse {
  success: boolean;
  games: Array<{
    game_id: string;
    last_played: string;
  }>;
}

export interface GameHistoryResponse {
  success: boolean;
  transactions: Array<{
    id: string;
    user_id: string;
    session_id: string;
    transaction_id: string;
    game_uuid: string;
    action: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}

export interface ProvidersResponse {
  currency?: string;
  providers?: string[];
  amount?: string;
}

export const casinoApi = {
  /**
   * Get games list with optional filters
   */
  async getGames(filters: GameFilters = {}): Promise<GameListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', String(filters.page));
    if (filters.perPage) params.append('perPage', String(filters.perPage));
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.type) params.append('type', filters.type);
    if (filters.expand) params.append('expand', filters.expand);
    if (filters.device) params.append('device', filters.device);

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/casino/games?${params.toString()}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch games' }));
      throw new Error(error.error || 'Failed to fetch games');
    }

    return response.json();
  },

  /**
   * Get game details by UUID
   */
  async getGame(gameId: string, expand?: string): Promise<CasinoGame> {
    const params = new URLSearchParams();
    if (expand) params.append('expand', expand);

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/casino/games/${encodeURIComponent(gameId)}?${params.toString()}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Game not found' }));
      throw new Error(error.error || 'Game not found');
    }

    return response.json();
  },

  /**
   * Launch a game
   */
  async launchGame(
    gameId: string,
    options: { device?: 'desktop' | 'mobile'; returnUrl?: string; language?: string } = {}
  ): Promise<LaunchResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      throw new Error('You must be logged in to play games');
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/casino/games/${encodeURIComponent(gameId)}/launch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device: options.device || 'desktop',
          returnUrl: options.returnUrl || null,
          language: options.language || 'en',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to launch game' }));
      throw new Error(error.error || error.message || 'Failed to launch game');
    }

    return response.json();
  },

  /**
   * Get user's recent games
   */
  async getRecentGames(limit: number = 10): Promise<RecentGamesResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      return { success: true, games: [] };
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/casino/recent?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return { success: true, games: [] };
    }

    return response.json();
  },

  /**
   * Get user's game history
   */
  async getGameHistory(filters: {
    limit?: number;
    gameId?: string;
    action?: string;
  } = {}): Promise<GameHistoryResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      return { success: true, transactions: [] };
    }

    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.gameId) params.append('gameId', filters.gameId);
    if (filters.action) params.append('action', filters.action);

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/casino/history?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return { success: true, transactions: [] };
    }

    return response.json();
  },

  /**
   * Get enabled providers
   */
  async getProviders(currency?: string): Promise<ProvidersResponse | ProvidersResponse[]> {
    const params = new URLSearchParams();
    if (currency) params.append('currency', currency);

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/casino/providers?${params.toString()}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch providers');
    }

    return response.json();
  },
};
