import { Match, Sport, CasinoGame } from '@/types';

export const sports: Sport[] = [
  { id: 'football', name: 'Football', icon: '⚽', matchCount: 145, isPopular: true },
  { id: 'afl', name: 'AFL', icon: '🏉', matchCount: 12 },
  { id: 'baseball', name: 'Baseball', icon: '⚾', matchCount: 45 },
  { id: 'basketball', name: 'Basketball', icon: '🏀', matchCount: 89, isPopular: true },
  { id: 'formula-1', name: 'Formula 1', icon: '🏎️', matchCount: 1 },
  { id: 'handball', name: 'Handball', icon: '🤾', matchCount: 19 },
  { id: 'hockey', name: 'Hockey', icon: '🏒', matchCount: 28 },
  { id: 'mma', name: 'MMA', icon: '🥋', matchCount: 8 },
  { id: 'nba', name: 'NBA', icon: '🏀', matchCount: 14, isPopular: true },
  { id: 'nfl', name: 'NFL', icon: '🏈', matchCount: 16, isPopular: true },
  { id: 'rugby', name: 'Rugby', icon: '🏉', matchCount: 16 },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', matchCount: 31 },
];

export const matches: Match[] = [
  {
    id: '1',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    sport: 'football',
    league: 'Premier League',
    startTime: '2025-01-15T15:00:00Z',
    status: 'upcoming',
    odds: { home: 2.45, draw: 3.20, away: 2.90 }
  },
  {
    id: '2',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    sport: 'basketball',
    league: 'NBA',
    startTime: '2025-01-15T20:00:00Z',
    status: 'live',
    homeScore: 89,
    awayScore: 92,
    minute: 78,
    odds: { home: 1.85, away: 1.95 }
  },
  {
    id: '3',
    homeTeam: 'Chiefs',
    awayTeam: 'Ravens',
    sport: 'american-football',
    league: 'NFL',
    startTime: '2025-01-16T18:00:00Z',
    status: 'upcoming',
    odds: { home: 1.65, away: 2.25 }
  },
  {
    id: '4',
    homeTeam: 'Novak Djokovic',
    awayTeam: 'Rafael Nadal',
    sport: 'tennis',
    league: 'Australian Open',
    startTime: '2025-01-17T09:00:00Z',
    status: 'upcoming',
    odds: { home: 1.75, away: 2.05 }
  }
];

export const liveMatches: Match[] = [
  {
    id: '2',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    sport: 'basketball',
    league: 'NBA',
    startTime: '2025-01-15T20:00:00Z',
    status: 'live',
    homeScore: 89,
    awayScore: 92,
    minute: 78,
    odds: { home: 1.85, away: 1.95 },
    isLive: true
  },
  {
    id: '5',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    sport: 'football',
    league: 'La Liga',
    startTime: '2025-01-15T19:00:00Z',
    status: 'live',
    homeScore: 1,
    awayScore: 0,
    minute: 65,
    odds: { home: 2.10, draw: 3.45, away: 3.20 },
    isLive: true
  }
];

export const casinoGames: CasinoGame[] = [
  {
    id: '1',
    name: 'Starburst',
    provider: 'NetEnt',
    category: 'slots',
    rtp: 96.1
  } as unknown as CasinoGame,
  {
    id: '2',
    name: 'Live Blackjack',
    provider: 'Evolution',
    category: 'live',
    isLive: true
  } as unknown as CasinoGame,
  {
    id: '3',
    name: 'Mega Moolah',
    provider: 'Microgaming',
    category: 'jackpots',
    jackpot: 15420000,
    rtp: 88.1
  } as unknown as CasinoGame,
  {
    id: '4',
    name: 'Sweet Bonanza',
    provider: 'Pragmatic Play',
    category: 'slots',
    isNew: true,
    rtp: 96.5
  } as unknown as CasinoGame
];

export const casinoCategories = [
  { id: 'home', name: 'Page d\'accueil', icon: 'Home', count: 0 },
  { id: 'offers', name: 'Offres', icon: 'Gift', count: 15 },
  { id: 'new-games', name: 'Nouveautés', icon: 'Sparkles', count: 23 },
  { id: 'live-casino', name: 'Casino Live', icon: 'Video', count: 45 },
  { id: 'slots', name: 'Machines à sous', icon: 'Cherry', count: 1250 },
  { id: 'table-games', name: 'Jeux de table et de cartes', icon: 'Spade', count: 87 },
  { id: 'crash-arcade', name: 'Jeux Crash & Arcade', icon: 'Zap', count: 34 },
  { id: 'poker', name: 'Poker', icon: 'Club', count: 12 },
  { id: 'jackpots', name: 'Jackpots', icon: 'Crown', count: 56 },
  { id: 'bingo', name: 'Bingo', icon: 'Circle', count: 18 },
  { id: 'all-games', name: 'Tous les jeux', icon: 'Grid3X3', count: 1540 }
];