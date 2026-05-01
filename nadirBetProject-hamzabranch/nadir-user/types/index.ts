export interface MatchMarketOutcome {
  name: string;
  price: number;
  line?: number;
  point?: number; // For spreads, totals, etc.
  description?: string; // For player props
}

export interface MatchMarket {
  key: string;
  outcomes: MatchMarketOutcome[];
  last_update?: string;
}

export type MarketType = 
  | 'h2h' 
  | 'spreads' 
  | 'totals' 
  | 'btts' 
  | 'draw_no_bet' 
  | 'double_chance'
  | 'alternate_spreads'
  | 'alternate_totals'
  | 'team_totals'
  | 'alternate_team_totals'
  | string; // For player props and other markets

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  sport: string;
  league: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  odds: {
    home: number;
    draw?: number;
    away: number;
  };
  isLive?: boolean;
  minute?: number;
  markets?: MatchMarket[];
  primaryBookmaker?: string;
  lastUpdate?: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  matchCount: number;
  isPopular?: boolean;
}

export interface CasinoGame {
  uuid: string; // Slotegrator UUID (primary identifier)
  id?: string; // Legacy/compatibility field
  name: string;
  image: string; // Game image URL from Slotegrator
  type: string; // Game type (e.g., 'Slots', 'Live Casino')
  provider: string; // Provider name
  provider_id: number; // Provider ID
  technology: string; // 'Flash', 'HTML5', etc.
  has_lobby: number; // 0 or 1 - indicates if game has lobby
  is_mobile: number; // 0 or 1 - CRITICAL: 0 = desktop only, 1 = mobile only
  has_freespins: number; // 0 or 1
  has_tables: number; // 0 or 1
  freespin_valid_until_full_day?: number; // 0 or 1
  label?: string; // Sub provider's label
  tags?: Array<{
    code: string;
    label: string;
    category?: {
      code: string;
      label: string;
    };
  }>;
  parameters?: {
    rtp?: number;
    volatility?: string;
    reels_count?: string;
    lines_count?: number;
  };
  images?: Array<{
    name: string;
    file: string;
    url: string;
    type: string;
  }>;
  related_games?: CasinoGame[];
  // Legacy/compatibility fields
  category?: string; // Mapped from type
  isNew?: boolean; // Can be derived from tags or other logic
  isLive?: boolean; // Mapped from type === 'Live Casino' or similar
  jackpot?: number; // Can be fetched from jackpots endpoint
  rtp?: number; // From parameters.rtp
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  avatar?: string;
  favorites: string[];
}

export interface Bet {
  id: string;
  matchId: string;
  type: string;
  selection: string;
  odds: number;
  stake: number;
  status: 'pending' | 'won' | 'lost' | 'voided';
}