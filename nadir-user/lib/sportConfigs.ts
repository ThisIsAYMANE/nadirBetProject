// Sport configurations for dynamic pages

export interface SportConfig {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  leagues: { key: string; label: string }[];
}

export const sportConfigs: Record<string, SportConfig> = {
  'football': {
    key: 'football',
    name: 'Football',
    icon: '⚽',
    description: 'Live Betting Odds & Matches',
    color: 'bg-green-600',
    leagues: [
      { key: 'soccer_epl', label: 'Premier League' }
    ]
  },
  'basketball': {
    key: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    description: 'NBA, EuroLeague, WNBA & More',
    color: 'bg-orange-600',
    leagues: [
      { key: 'basketball_nba', label: 'NBA' },
      { key: 'basketball_euroleague', label: 'EuroLeague' },
      { key: 'basketball_wnba', label: 'WNBA' }
    ]
  },
  'american-football': {
    key: 'american-football',
    name: 'American Football',
    icon: '🏈',
    description: 'NFL, NCAA & More',
    color: 'bg-blue-600',
    leagues: [
      { key: 'americanfootball_nfl', label: 'NFL' },
      { key: 'americanfootball_ncaaf', label: 'NCAA' }
    ]
  },
  'tennis': {
    key: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    description: 'ATP, WTA, Grand Slam & More',
    color: 'bg-yellow-600',
    leagues: [
      { key: 'tennis_atp', label: 'ATP' },
      { key: 'tennis_wta', label: 'WTA' }
    ]
  },
  'baseball': {
    key: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    description: 'MLB & More',
    color: 'bg-red-600',
    leagues: [
      { key: 'baseball_mlb', label: 'MLB' }
    ]
  },
  'ice-hockey': {
    key: 'ice-hockey',
    name: 'Ice Hockey',
    icon: '🏒',
    description: 'NHL & More',
    color: 'bg-blue-500',
    leagues: [
      { key: 'icehockey_nhl', label: 'NHL' }
    ]
  },
  'boxing': {
    key: 'boxing',
    name: 'Boxing',
    icon: '🥊',
    description: 'Championship Fights & Events',
    color: 'bg-red-700',
    leagues: [
      { key: 'boxing', label: 'All Boxing' }
    ]
  },
  'mma': {
    key: 'mma',
    name: 'MMA',
    icon: '🥋',
    description: 'UFC, Bellator & More',
    color: 'bg-orange-700',
    leagues: [
      { key: 'mma_mixed_martial_arts', label: 'All MMA' }
    ]
  },
  'cricket': {
    key: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    description: 'Test, ODI, T20 & More',
    color: 'bg-green-700',
    leagues: [
      { key: 'cricket_test_match', label: 'Test' },
      { key: 'cricket_odi', label: 'ODI' },
      { key: 'cricket_big_bash', label: 'Big Bash' }
    ]
  },
  'futsal': {
    key: 'futsal',
    name: 'Futsal',
    icon: '⚽',
    description: 'Indoor Football Leagues',
    color: 'bg-teal-600',
    leagues: [
      { key: 'soccer_brazil_campeonato', label: 'Brazil' }
    ]
  },
  'handball': {
    key: 'handball',
    name: 'Handball',
    icon: '🤾',
    description: 'European Leagues & Championships',
    color: 'bg-indigo-600',
    leagues: [
      { key: 'handball', label: 'All Handball' }
    ]
  },
  'rugby': {
    key: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    description: 'Rugby League & Union',
    color: 'bg-purple-600',
    leagues: [
      { key: 'rugbyleague_nrl', label: 'NRL' },
      { key: 'rugbyunion_super_rugby', label: 'Super Rugby' }
    ]
  },
  'table-tennis': {
    key: 'table-tennis',
    name: 'Table Tennis',
    icon: '🏓',
    description: 'Professional Table Tennis',
    color: 'bg-pink-600',
    leagues: [
      { key: 'table_tennis', label: 'All Table Tennis' }
    ]
  }
};

export function getSportConfig(sportKey: string): SportConfig {
  return sportConfigs[sportKey] || {
    key: sportKey,
    name: sportKey.charAt(0).toUpperCase() + sportKey.slice(1),
    icon: '🎯',
    description: 'Sports Betting',
    color: 'bg-gray-600',
    leagues: []
  };
}

