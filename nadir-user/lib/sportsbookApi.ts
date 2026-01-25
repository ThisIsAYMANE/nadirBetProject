// Sportsbook API integration utilities

import type { Match, MatchMarket, MatchMarketOutcome } from '@/types';

const RAPIDAPI_KEY =
  process.env.NEXT_PUBLIC_RAPIDAPI_KEY ||
  'dd63db8b01mshd6d18807660bf17p1b8435jsnb348210fe82f';
const RAPIDAPI_HOST = 'sportsbook-api2.p.rapidapi.com';
const API_BASE_URL = `https://${RAPIDAPI_HOST}/v0`;

// Backend API base URL for internal betting routes
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Raw sport object as returned by the RapidAPI sportsbook /sports endpoint
export interface RawSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

// Normalized representation used by the UI
export interface NormalizedSport {
  // Original API key, e.g. "soccer_england_efl_cup"
  sportKey: string;
  // Original API group label, e.g. "Soccer"
  group: string;
  // Internal category slug used in routes, e.g. "football", "american-football"
  category: string;
  // Display name for the UI, e.g. "EFL Cup"
  title: string;
  description: string;
  // Outright competition (winner markets, futures) or regular league
  isOutright: boolean;
  active: boolean;
  hasOutrights: boolean;
}

export interface FilteredSportsResult {
  all: NormalizedSport[];
  byCategory: Record<string, NormalizedSport[]>;
}

// Map API groups to our internal category slugs
const GROUP_CATEGORY_MAP: Record<string, string> = {
  Soccer: 'football',
  'American Football': 'american-football',
  Basketball: 'basketball',
  Tennis: 'tennis',
  'Ice Hockey': 'ice-hockey',
  Cricket: 'cricket',
  'Rugby League': 'rugby',
  'Rugby Union': 'rugby',
  Baseball: 'baseball',
  'Mixed Martial Arts': 'mma',
  Boxing: 'boxing',
  // The UI does not yet expose these, but we keep a mapping
  'Aussie Rules': 'football',
  Golf: 'golf',
  Lacrosse: 'lacrosse',
};

// Fallback based on the key prefix before the first underscore
const PREFIX_CATEGORY_MAP: Record<string, string> = {
  soccer: 'football',
  americanfootball: 'american-football',
  basketball: 'basketball',
  tennis: 'tennis',
  icehockey: 'ice-hockey',
  cricket: 'cricket',
  rugbyunion: 'rugby',
  rugbyleague: 'rugby',
  baseball: 'baseball',
  mma: 'mma',
  boxing: 'boxing',
};

// Only these groups are shown in the sports UI
const ENABLED_GROUPS: string[] = [
  'Soccer',
  'American Football',
  'Basketball',
  'Tennis',
  'Ice Hockey',
  'Cricket',
  'Rugby League',
  'Rugby Union',
  'Baseball',
  'Mixed Martial Arts',
  'Boxing',
];

// Explicitly hide keys we never want to expose (e.g. Politics)
const DISABLED_KEYS: string[] = [
  'politics_us_presidential_election_winner',
];

function inferCategoryFromGroupAndKey(group: string, key: string): string | null {
  if (GROUP_CATEGORY_MAP[group]) {
    return GROUP_CATEGORY_MAP[group];
  }

  const prefix = key.split('_')[0];
  if (PREFIX_CATEGORY_MAP[prefix]) {
    return PREFIX_CATEGORY_MAP[prefix];
  }

  return null;
}

function inferIsOutright(raw: RawSport): boolean {
  if (raw.has_outrights) return true;
  // Common naming convention for outrights/futures
  if (/_winner$/.test(raw.key)) return true;
  return false;
}

export function normalizeSport(raw: RawSport): NormalizedSport | null {
  if (!raw.active) return null;
  if (DISABLED_KEYS.includes(raw.key)) return null;
  if (!ENABLED_GROUPS.includes(raw.group)) return null;

  const category = inferCategoryFromGroupAndKey(raw.group, raw.key);
  if (!category) {
    // Unknown group – drop from the main UI for now
    return null;
  }

  return {
    sportKey: raw.key,
    group: raw.group,
    category,
    title: raw.title,
    description: raw.description,
    isOutright: inferIsOutright(raw),
    active: raw.active,
    hasOutrights: raw.has_outrights,
  };
}

const RAPIDAPI_SPORTS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFilteredSports: { value: FilteredSportsResult; expiresAt: number } | null = null;

export interface SportsbookEvent {
  id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: string;
  home_score?: number;
  away_score?: number;
  bookmakers?: {
    name: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

export interface SportsbookAdvantage {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

export interface SportsbookOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      last_update: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

// Sport key mapping for the API
export const SPORT_KEYS: Record<string, string> = {
  'football': 'soccer_epl',
  'basketball': 'basketball_nba',
  'american-football': 'americanfootball_nfl',
  'baseball': 'baseball_mlb',
  'ice-hockey': 'icehockey_nhl',
  'tennis': 'tennis_atp',
  'boxing': 'boxing',
  'mma': 'mma_mixed_martial_arts',
  'cricket': 'cricket_test_match',
  'rugby': 'rugbyleague_nrl',
  'handball': 'handball',
  'futsal': 'soccer_brazil_campeonato',
  'table-tennis': 'table_tennis'
};

// Available sport keys for different sports
export const SPORT_LEAGUES: Record<string, string[]> = {
  'football': ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a', 'soccer_uefa_champs_league'],
  'basketball': ['basketball_nba', 'basketball_euroleague', 'basketball_wnba'],
  'american-football': ['americanfootball_nfl', 'americanfootball_ncaaf'],
  'baseball': ['baseball_mlb'],
  'ice-hockey': ['icehockey_nhl'],
  'tennis': ['tennis_atp', 'tennis_wta'],
  'boxing': ['boxing'],
  'mma': ['mma_mixed_martial_arts'],
  'cricket': ['cricket_test_match', 'cricket_odi', 'cricket_big_bash'],
  'rugby': ['rugbyleague_nrl', 'rugbyunion_super_rugby'],
  'handball': ['handball'],
  'futsal': ['soccer_brazil_campeonato'],
  'table-tennis': ['table_tennis']
};

// Fetch options for the API
const getFetchOptions = (method: string = 'GET'): RequestInit => ({
  method,
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  },
  next: { revalidate: 60 } // Cache for 60 seconds
});

/**
 * Fetch arbitrage opportunities
 */
export async function fetchArbitrageData(type: string = 'ARBITRAGE'): Promise<unknown> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/advantages/?type=${type}`,
      getFetchOptions()
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching arbitrage data:', error);
    throw error;
  }
}

/**
 * Fetch odds for a specific sport
 */
export async function fetchOddsBySport(sportKey: string, region: string = 'us', markets: string = 'h2h'): Promise<SportsbookOdds[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/odds/${sportKey}?region=${region}&markets=${markets}`,
      getFetchOptions()
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching odds for ${sportKey}:`, error);
    throw error;
  }
}

/**
 * Fetch all available sports
 */
export async function fetchAvailableSports(): Promise<RawSport[]> {
  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/betting/sports?all=true`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as RawSport[];
    return data;
  } catch (error) {
    console.error('Error fetching available sports:', error);
    throw error;
  }
}

/**
 * Get filtered + normalized sports list, grouped by internal category.
 */
export async function getFilteredSports(): Promise<FilteredSportsResult> {
  const now = Date.now();
  if (cachedFilteredSports && cachedFilteredSports.expiresAt > now) {
    return cachedFilteredSports.value;
  }

  const rawSports = await fetchAvailableSports();
  const normalized: NormalizedSport[] = [];

  for (const raw of rawSports) {
    const norm = normalizeSport(raw);
    if (norm) {
      normalized.push(norm);
    }
  }

  const byCategory: Record<string, NormalizedSport[]> = {};
  for (const sport of normalized) {
    if (!byCategory[sport.category]) {
      byCategory[sport.category] = [];
    }
    byCategory[sport.category].push(sport);
  }

  const result: FilteredSportsResult = {
    all: normalized,
    byCategory,
  };

  cachedFilteredSports = {
    value: result,
    expiresAt: now + RAPIDAPI_SPORTS_CACHE_TTL_MS,
  };

  return result;
}

/**
 * Fetch odds for multiple sports/leagues
 */
export async function fetchOddsForMultipleSports(sportKeys: string[], region: string = 'us', markets: string = 'h2h,spreads,totals'): Promise<SportsbookOdds[]> {
  try {
    const promises = sportKeys.map(sportKey => 
      fetchOddsBySport(sportKey, region, markets).catch(err => {
        console.error(`Failed to fetch ${sportKey}:`, err);
        return [];
      })
    );
    
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching odds for multiple sports:', error);
    throw error;
  }
}

/**
 * Transform API data to our Match interface
 */
export function transformToMatch(event: SportsbookOdds): Match {
  const primaryBookmaker = event.bookmakers?.[0];
  const h2hMarket = primaryBookmaker?.markets?.find((m) => m.key === 'h2h');

  let homeOdds = 2.00;
  let awayOdds = 2.00;
  let drawOdds: number | undefined;

  if (h2hMarket) {
    const homeOutcome = h2hMarket.outcomes.find((o) => o.name === event.home_team);
    const awayOutcome = h2hMarket.outcomes.find((o) => o.name === event.away_team);
    const drawOutcome = h2hMarket.outcomes.find((o) => o.name === 'Draw' || o.name.toLowerCase().includes('draw'));

    homeOdds = homeOutcome?.price || 2.00;
    awayOdds = awayOutcome?.price || 2.00;
    drawOdds = drawOutcome?.price;
  }

  // Determine status based on commence time
  const now = new Date();
  const startTime = new Date(event.commence_time);
  const isLive = startTime <= now && startTime.getTime() > now.getTime() - (3 * 60 * 60 * 1000); // within 3 hours

  // Collect all markets from all bookmakers, prioritizing the first bookmaker
  // but also including unique markets from other bookmakers
  const marketMap = new Map<string, MatchMarket>();
  
  event.bookmakers?.forEach((bookmaker) => {
    bookmaker.markets?.forEach((market) => {
      if (!marketMap.has(market.key)) {
        marketMap.set(market.key, {
          key: market.key,
          outcomes: market.outcomes.map((outcome) => {
            const anyOutcome = outcome as MatchMarketOutcome & { 
              point?: number; 
              points?: number;
              description?: string;
            };
            return {
              name: outcome.name,
              price: outcome.price,
              line: anyOutcome.point ?? anyOutcome.points,
              point: anyOutcome.point ?? anyOutcome.points,
              description: anyOutcome.description,
            };
          }),
          last_update: market.last_update,
        });
      }
    });
  });

  const markets: MatchMarket[] = Array.from(marketMap.values());

  return {
    id: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    sport: event.sport_key,
    league: event.sport_title,
    startTime: event.commence_time,
    status: isLive ? 'live' : 'upcoming',
    odds: {
      home: homeOdds,
      draw: drawOdds,
      away: awayOdds,
    },
    isLive: isLive,
    markets,
    primaryBookmaker: primaryBookmaker?.title || primaryBookmaker?.key,
    lastUpdate: primaryBookmaker?.last_update,
  };
}

/**
 * Get sport-specific leagues for filtering
 */
export function getSportLeagues(sport: string): string[] {
  return SPORT_LEAGUES[sport] || [SPORT_KEYS[sport]];
}

/**
 * Format league name for display
 */
export function formatLeagueName(leagueKey: string): string {
  return leagueKey
    .replace(/_/g, ' ')
    .replace(/soccer |basketball |americanfootball |baseball |icehockey |tennis |cricket |rugby/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

