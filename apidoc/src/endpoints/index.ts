import { ApiFootball } from '../client';

export class LeaguesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    name?: string;
    country?: string;
    code?: string;
    season?: number;
    team?: number;
    type?: 'league' | 'cup';
    current?: string;
    search?: string;
    last?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/leagues', params, options);
  }

  async getSeasons(options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/leagues/seasons', undefined, options);
  }
}

export class TeamsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    name?: string;
    league?: number;
    season?: number;
    country?: string;
    code?: string;
    venue?: number;
    search?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/teams', params, options);
  }

  async getStatistics(params: {
    league: number;
    season: number;
    team: number;
    date?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/teams/statistics', params, options);
  }

  async getSeasons(params: { team: number }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/teams/seasons', params, options);
  }

  async getCountries(options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/teams/countries', undefined, options);
  }

  async getVenues(params?: {
    id?: number;
    name?: string;
    city?: string;
    country?: string;
    search?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/venues', params, options);
  }
}

export class FixturesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    ids?: string;
    live?: string;
    date?: string;
    league?: number;
    season?: number;
    team?: number;
    last?: number;
    next?: number;
    from?: string;
    to?: string;
    round?: string;
    status?: string;
    venue?: number;
    timezone?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures', params, options);
  }

  async getRounds(params: {
    league: number;
    season: number;
    current?: boolean;
    dates?: boolean;
    timezone?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures/rounds', params, options);
  }

  async getHeadToHead(params: {
    h2h: string;
    date?: string;
    league?: number;
    season?: number;
    last?: number;
    next?: number;
    from?: string;
    to?: string;
    status?: string;
    venue?: number;
    timezone?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures/headtohead', params, options);
  }

  async getStatistics(params: {
    fixture: number;
    team?: number;
    type?: string;
    half?: boolean;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures/statistics', params, options);
  }

  async getEvents(params: {
    fixture: number;
    team?: number;
    player?: number;
    type?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures/events', params, options);
  }

  async getLineups(params: {
    fixture: number;
    team?: number;
    player?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures/lineups', params, options);
  }

  async getPlayers(params: {
    fixture: number;
    team?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/fixtures/players', params, options);
  }
}

export class PlayersEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    name?: string;
    team?: number;
    league?: number;
    season?: number;
    search?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players', params, options);
  }

  async getSeasons(params: { player: number }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/seasons', params, options);
  }

  async getProfiles(params?: {
    page?: number;
    search?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/profiles', params, options);
  }

  async getSquads(params: {
    team: number;
    season?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/squads', params, options);
  }

  async getTeams(params: { player: number }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/teams', params, options);
  }

  async getTopScorers(params: {
    league?: number;
    season: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/topscorers', params, options);
  }

  async getTopAssists(params: {
    league?: number;
    season: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/topassists', params, options);
  }

  async getTopYellowCards(params: {
    league?: number;
    season: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/topyellowcards', params, options);
  }

  async getTopRedCards(params: {
    league?: number;
    season: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/players/topredcards', params, options);
  }
}

export class StandingsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: {
    league?: number;
    season: number;
    team?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/standings', params, options);
  }
}

export class OddsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: {
    fixture: number;
    bookmaker?: number;
    bet?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/odds', params, options);
  }

  async getLive(params?: {
    league?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/odds/live', params, options);
  }

  async getLiveBets(params?: {
    league?: number;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/odds/live/bets', params, options);
  }

  async getMapping(options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/odds/mapping', undefined, options);
  }

  async getBookmakers(options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/odds/bookmakers', undefined, options);
  }

  async getBets(options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/odds/bets', undefined, options);
  }
}

export class InjuriesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    fixture?: number;
    league?: number;
    season?: number;
    team?: number;
    player?: number;
    ids?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/injuries', params, options);
  }
}

export class PredictionsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: { fixture: number }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/predictions', params, options);
  }
}

export class TransfersEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: { player: number }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/transfers', params, options);
  }
}

export class TrophiesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    player?: number;
    coach?: number;
    players?: string;
    coachs?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/trophies', params, options);
  }
}

export class SidelinedEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    player?: number;
    coach?: number;
    players?: string;
    coachs?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/sidelined', params, options);
  }
}

export class CoachesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    name?: string;
    team?: number;
    search?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/coachs', params, options);
  }
}

export class CountriesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    name?: string;
    code?: string;
    search?: string;
  }, options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/countries', params, options);
  }
}

export class TimezoneEndpoint {
  constructor(private client: ApiFootball) {}

  async get(options?: { cache?: boolean; cacheTTL?: number }) {
    return this.client.request('/timezone', undefined, options);
  }
}