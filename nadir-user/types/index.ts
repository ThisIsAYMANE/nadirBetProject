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
  id: string;
  name: string;
  provider: string;
  category: string;
  isNew?: boolean;
  isLive?: boolean;
  jackpot?: number;
  rtp?: number;
  _pragmaticData?: Record<string, unknown>; // Store original Pragmatic game data
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