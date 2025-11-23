// Sportsbook API integration utilities

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'dd63db8b01mshd6d18807660bf17p1b8435jsnb348210fe82f';
const RAPIDAPI_HOST = 'sportsbook-api2.p.rapidapi.com';
const API_BASE_URL = `https://${RAPIDAPI_HOST}/v0`;

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
export async function fetchArbitrageData(type: string = 'ARBITRAGE'): Promise<any> {
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
export async function fetchAvailableSports(): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sports`,
      getFetchOptions()
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available sports:', error);
    throw error;
  }
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
export function transformToMatch(event: SportsbookOdds): any {
  const h2hMarket = event.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
  
  let homeOdds = 2.00;
  let awayOdds = 2.00;
  let drawOdds: number | undefined;

  if (h2hMarket) {
    const homeOutcome = h2hMarket.outcomes.find(o => o.name === event.home_team);
    const awayOutcome = h2hMarket.outcomes.find(o => o.name === event.away_team);
    const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

    homeOdds = homeOutcome?.price || 2.00;
    awayOdds = awayOutcome?.price || 2.00;
    drawOdds = drawOutcome?.price;
  }

  // Determine status based on commence time
  const now = new Date();
  const startTime = new Date(event.commence_time);
  const isLive = startTime <= now && startTime.getTime() > now.getTime() - (3 * 60 * 60 * 1000); // within 3 hours

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
      away: awayOdds
    },
    isLive: isLive
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

