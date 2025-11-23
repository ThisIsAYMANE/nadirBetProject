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
  _pragmaticData?: any; // Store original Pragmatic game data
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