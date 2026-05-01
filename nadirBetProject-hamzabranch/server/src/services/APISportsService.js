/**
 * APISportsService
 * ================
 * Unified service for all 12 API-Sports endpoints.
 * Based on official documentation for each sport.
 *
 * Key differences per sport:
 *  - Football:  base /fixtures  (not /games), v3 host
 *  - MMA:       /fights (not /games), core entity is /fighters (not /teams)
 *  - Formula-1: /races (not /games), /drivers, /competitions, /rankings
 *  - All others (AFL, Baseball, Basketball, Handball, Hockey, NBA, NFL, Rugby, Volleyball):
 *               /games, /teams, /players, /standings, /statistics, /odds
 */

// Each sport's host and its "matches" endpoint name
const SPORT_CONFIG = {
  FOOTBALL: {
    host: 'v3.football.api-sports.io',
    matchesEndpoint: 'fixtures',      // Football uses /fixtures
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'fixture',             // odds?fixture=ID
  },
  AFL: {
    host: 'v1.afl.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  BASEBALL: {
    host: 'v1.baseball.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  BASKETBALL: {
    host: 'v1.basketball.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  FORMULA_1: {
    host: 'v1.formula-1.api-sports.io',
    matchesEndpoint: 'races',         // F1 uses /races
    teamsEndpoint: 'teams',           // constructors
    playersEndpoint: 'drivers',       // F1 uses /drivers not /players
    standingsEndpoint: 'rankings/drivers',
    statisticsEndpoint: null,         // No stats endpoint for F1
    oddsParam: null,                  // No odds for F1
  },
  HANDBALL: {
    host: 'v1.handball.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  HOCKEY: {
    host: 'v1.hockey.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  MMA: {
    host: 'v1.mma.api-sports.io',
    matchesEndpoint: 'fights',        // MMA uses /fights
    teamsEndpoint: 'fighters',        // MMA uses /fighters not /teams
    playersEndpoint: 'fighters',
    standingsEndpoint: 'rankings',    // MMA uses /rankings not /standings
    statisticsEndpoint: 'statistics',
    oddsParam: null,                  // No odds for MMA
  },
  NBA: {
    host: 'v2.nba.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  NFL: {
    host: 'v1.american-football.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  RUGBY: {
    host: 'v1.rugby.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
  VOLLEYBALL: {
    host: 'v1.volleyball.api-sports.io',
    matchesEndpoint: 'games',
    teamsEndpoint: 'teams',
    playersEndpoint: 'players',
    standingsEndpoint: 'standings',
    statisticsEndpoint: 'statistics',
    oddsParam: 'game',
  },
};

// Map URL-friendly slugs to SPORT_CONFIG keys
const SLUG_MAP = {
  'football': 'FOOTBALL',
  'afl': 'AFL',
  'baseball': 'BASEBALL',
  'basketball': 'BASKETBALL',
  'formula-1': 'FORMULA_1',
  'handball': 'HANDBALL',
  'hockey': 'HOCKEY',
  'mma': 'MMA',
  'nba': 'NBA',
  'nfl': 'NFL',
  'rugby': 'RUGBY',
  'volleyball': 'VOLLEYBALL',
};

class APISportsService {
  getApiKey() {
    return process.env.APISPORTS_KEY || 'a9899344551cd122ddba65c6b44f5787';
  }

  getSportConfig(sport) {
    const key = SLUG_MAP[sport.toLowerCase()] || sport.toUpperCase().replace(/-/g, '_');
    const config = SPORT_CONFIG[key];
    if (!config) {
      throw new Error(`Unsupported sport: ${sport}. Supported: ${Object.keys(SLUG_MAP).join(', ')}`);
    }
    return { config, key };
  }

  async makeRequest(sport, endpoint, params = {}) {
    const { config } = this.getSportConfig(sport);
    const host = config.host;

    // Strip any leading slash for safety
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const url = new URL(`https://${host}/${cleanEndpoint}`);

    // Append query params — skip undefined/null values
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.append(k, v);
      }
    });

    try {
      console.log(`[APISports] ${sport.toUpperCase()} → GET /${cleanEndpoint}?${url.searchParams.toString()}`);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-apisports-key': this.getApiKey(),
          'x-apisports-host': host,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const errors = data.errors;
      const hasErrors = errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0);
      if (hasErrors) {
        console.error(`[APISports] API error for ${sport} (${cleanEndpoint}):`, errors);
      }

      return data;
    } catch (error) {
      console.error(`[APISports] Request failed for ${sport} (${cleanEndpoint}):`, error.message);
      throw error;
    }
  }

  // ─── Convenience methods ─────────────────────────────────────────────────

  /** Get today's or a specific date's matches/fixtures/fights/races */
  async getMatches(sport, params = {}) {
    const { config } = this.getSportConfig(sport);
    return this.makeRequest(sport, config.matchesEndpoint, params);
  }

  /** Get live matches */
  async getLiveMatches(sport, params = {}) {
    const { config, key } = this.getSportConfig(sport);
    if (key === 'FOOTBALL') {
      return this.makeRequest(sport, config.matchesEndpoint, { live: 'all', ...params });
    }
    return this.makeRequest(sport, config.matchesEndpoint, { live: true, ...params });
  }

  /** Get teams / constructors / fighters */
  async getTeams(sport, params = {}) {
    const { config } = this.getSportConfig(sport);
    return this.makeRequest(sport, config.teamsEndpoint, params);
  }

  /** Get players / drivers / fighters */
  async getPlayers(sport, params = {}) {
    const { config } = this.getSportConfig(sport);
    return this.makeRequest(sport, config.playersEndpoint, params);
  }

  /** Get standings / rankings */
  async getStandings(sport, params = {}) {
    const { config } = this.getSportConfig(sport);
    return this.makeRequest(sport, config.standingsEndpoint, params);
  }

  /** Get leagues */
  async getLeagues(sport, params = {}) {
    return this.makeRequest(sport, 'leagues', params);
  }

  /** Get seasons */
  async getSeasons(sport) {
    const { key } = this.getSportConfig(sport);
    // NBA uses /seasons, others use /leagues/seasons
    if (key === 'NBA' || key === 'FORMULA_1') {
      return this.makeRequest(sport, 'seasons');
    }
    return this.makeRequest(sport, 'leagues/seasons');
  }

  /** Get statistics */
  async getStatistics(sport, params = {}) {
    const { config } = this.getSportConfig(sport);
    if (!config.statisticsEndpoint) {
      return { results: 0, response: [] };
    }
    return this.makeRequest(sport, config.statisticsEndpoint, params);
  }

  /** Get odds for a specific match/game/fixture */
  async getOdds(sport, matchId, params = {}) {
    const { config } = this.getSportConfig(sport);
    if (!config.oddsParam) {
      console.warn(`[APISports] No odds endpoint for ${sport}`);
      return { results: 0, response: [] };
    }
    return this.makeRequest(sport, 'odds', { [config.oddsParam]: matchId, ...params });
  }

  /** Get live odds */
  async getLiveOdds(sport, matchId) {
    const { config } = this.getSportConfig(sport);
    if (!config.oddsParam) {
      return { results: 0, response: [] };
    }
    return this.makeRequest(sport, 'odds/live', { [config.oddsParam]: matchId });
  }

  /** Get predictions for a match */
  async getPredictions(sport, matchId) {
    const { key } = this.getSportConfig(sport);
    // Football uses fixture=ID, others use game=ID
    const paramKey = key === 'FOOTBALL' ? 'fixture' : key === 'MMA' ? 'fight_id' : 'game';
    return this.makeRequest(sport, 'predictions', { [paramKey]: matchId });
  }

  /** Get head-to-head history */
  async getH2H(sport, h2hParam, params = {}) {
    const { config } = this.getSportConfig(sport);
    const subPath = config.matchesEndpoint === 'fixtures' ? 'fixtures/headtohead' : 'games/h2h';
    return this.makeRequest(sport, subPath, { h2h: h2hParam, ...params });
  }

  /** Get match statistics (for a specific game/fixture) */
  async getMatchStatistics(sport, matchId, params = {}) {
    const { config, key } = this.getSportConfig(sport);
    const subPath = config.matchesEndpoint === 'fixtures' ? 'fixtures/statistics' : 'games/statistics';
    const idParam = key === 'FOOTBALL' ? 'fixture' : 'id';
    return this.makeRequest(sport, subPath, { [idParam]: matchId, ...params });
  }

  /** Get match events */
  async getMatchEvents(sport, matchId) {
    const { config, key } = this.getSportConfig(sport);
    const subPath = config.matchesEndpoint === 'fixtures' ? 'fixtures/events' : 'games/events';
    const idParam = key === 'FOOTBALL' ? 'fixture' : 'id';
    return this.makeRequest(sport, subPath, { [idParam]: matchId });
  }

  /** Formula-1 specific: get drivers */
  async getDrivers(season) {
    return this.makeRequest('formula-1', 'drivers', { season });
  }

  /** Formula-1 specific: get constructor (team) standings */
  async getConstructorStandings(season) {
    return this.makeRequest('formula-1', 'rankings/teams', { season });
  }

  /** Formula-1 specific: get race results */
  async getRaceResults(raceId, season) {
    return this.makeRequest('formula-1', 'results', { race: raceId, season });
  }

  /** MMA specific: get events (fight nights) */
  async getMMAEvents(params = {}) {
    return this.makeRequest('mma', 'events', params);
  }

  /** MMA specific: get rankings by weight class */
  async getMMARankings(params = {}) {
    return this.makeRequest('mma', 'rankings', params);
  }

  /** API status / quota check */
  async getStatus(sport) {
    return this.makeRequest(sport, 'status');
  }
}

export default new APISportsService();
