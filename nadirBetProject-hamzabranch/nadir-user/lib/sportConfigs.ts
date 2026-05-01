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
    leagues: []
  },
  'afl': {
    key: 'afl',
    name: 'AFL',
    icon: '🏉',
    description: 'Aussie Rules Football',
    color: 'bg-red-600',
    leagues: []
  },
  'baseball': {
    key: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    description: 'MLB & More',
    color: 'bg-blue-600',
    leagues: []
  },
  'basketball': {
    key: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    description: 'NBA, EuroLeague & More',
    color: 'bg-orange-600',
    leagues: []
  },
  'formula-1': {
    key: 'formula-1',
    name: 'Formula 1',
    icon: '🏎️',
    description: 'Grand Prix Races',
    color: 'bg-red-700',
    leagues: []
  },
  'handball': {
    key: 'handball',
    name: 'Handball',
    icon: '🤾',
    description: 'Professional Handball',
    color: 'bg-indigo-600',
    leagues: []
  },
  'hockey': {
    key: 'hockey',
    name: 'Hockey',
    icon: '🏒',
    description: 'NHL & International',
    color: 'bg-blue-500',
    leagues: []
  },
  'mma': {
    key: 'mma',
    name: 'MMA',
    icon: '🥋',
    description: 'UFC & Mixed Martial Arts',
    color: 'bg-orange-700',
    leagues: []
  },
  'nba': {
    key: 'nba',
    name: 'NBA',
    icon: '🏀',
    description: 'National Basketball Association',
    color: 'bg-blue-700',
    leagues: []
  },
  'nfl': {
    key: 'nfl',
    name: 'NFL',
    icon: '🏈',
    description: 'National Football League',
    color: 'bg-blue-800',
    leagues: []
  },
  'rugby': {
    key: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    description: 'Rugby Union & League',
    color: 'bg-purple-600',
    leagues: []
  },
  'volleyball': {
    key: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    description: 'International Volleyball',
    color: 'bg-yellow-500',
    leagues: []
  }
};

export function getSportConfig(sportKey: string): SportConfig {
  return sportConfigs[sportKey.toLowerCase()] || {
    key: sportKey,
    name: sportKey.charAt(0).toUpperCase() + sportKey.slice(1),
    icon: '🎯',
    description: 'Sports Betting',
    color: 'bg-gray-600',
    leagues: []
  };
}
