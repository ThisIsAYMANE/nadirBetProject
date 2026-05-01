// Sportsbook API integration utilities

import type { Match } from '@/types';

// Normalized representation used by the UI
export interface NormalizedSport {
  sportKey: string;
  group: string;
  category: string;
  title: string;
  description: string;
  isOutright: boolean;
  active: boolean;
  hasOutrights: boolean;
}

export interface FilteredSportsResult {
  all: NormalizedSport[];
  byCategory: Record<string, NormalizedSport[]>;
}

// Map the new API-Sports to our frontend formats
export const NEW_SPORTS: NormalizedSport[] = [
  { sportKey: 'football', title: 'Football', group: 'Football', category: 'football', description: 'Football matches', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'afl', title: 'AFL', group: 'AFL', category: 'afl', description: 'Australian Football League', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'baseball', title: 'Baseball', group: 'Baseball', category: 'baseball', description: 'Baseball games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'basketball', title: 'Basketball', group: 'Basketball', category: 'basketball', description: 'Basketball games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'formula-1', title: 'Formula 1', group: 'Motorsport', category: 'formula-1', description: 'F1 Races', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'handball', title: 'Handball', group: 'Handball', category: 'handball', description: 'Handball games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'hockey', title: 'Hockey', group: 'Hockey', category: 'hockey', description: 'Hockey games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'mma', title: 'MMA', group: 'MMA', category: 'mma', description: 'MMA Fights', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'nba', title: 'NBA', group: 'Basketball', category: 'nba', description: 'NBA games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'nfl', title: 'NFL', group: 'American Football', category: 'nfl', description: 'NFL games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'rugby', title: 'Rugby', group: 'Rugby', category: 'rugby', description: 'Rugby games', isOutright: false, active: true, hasOutrights: false },
  { sportKey: 'volleyball', title: 'Volleyball', group: 'Volleyball', category: 'volleyball', description: 'Volleyball games', isOutright: false, active: true, hasOutrights: false },
];

/**
 * Get filtered + normalized sports list, grouped by internal category.
 */
export async function getFilteredSports(): Promise<FilteredSportsResult> {
  const normalized = NEW_SPORTS;
  const byCategory: Record<string, NormalizedSport[]> = {};
  
  for (const sport of normalized) {
    if (!byCategory[sport.category]) {
      byCategory[sport.category] = [];
    }
    byCategory[sport.category].push(sport);
  }

  return {
    all: normalized,
    byCategory,
  };
}
