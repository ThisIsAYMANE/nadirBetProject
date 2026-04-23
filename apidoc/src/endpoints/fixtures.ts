import { ApiFootball } from '../client';
import { FixturesResponse, RoundsResponse, HeadToHeadResponse, FixtureStatisticsResponse, FixtureEventsResponse, FixtureLineupsResponse, FixturePlayersResponse, RequestOptions } from '../types';

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
  }, options?: RequestOptions): Promise<FixturesResponse> {
    return this.client.request('/fixtures', params, options);
  }

  async getRounds(params: {
    league: number;
    season: number;
    current?: boolean;
    dates?: boolean;
    timezone?: string;
  }, options?: RequestOptions): Promise<RoundsResponse> {
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
  }, options?: RequestOptions): Promise<HeadToHeadResponse> {
    return this.client.request('/fixtures/headtohead', params, options);
  }

  async getStatistics(params: {
    fixture: number;
    team?: number;
    type?: string;
    half?: boolean;
  }, options?: RequestOptions): Promise<FixtureStatisticsResponse> {
    return this.client.request('/fixtures/statistics', params, options);
  }

  async getEvents(params: {
    fixture: number;
    team?: number;
    player?: number;
    type?: string;
  }, options?: RequestOptions): Promise<FixtureEventsResponse> {
    return this.client.request('/fixtures/events', params, options);
  }

  async getLineups(params: {
    fixture: number;
    team?: number;
    player?: number;
  }, options?: RequestOptions): Promise<FixtureLineupsResponse> {
    return this.client.request('/fixtures/lineups', params, options);
  }

  async getPlayers(params: {
    fixture: number;
    team?: number;
  }, options?: RequestOptions): Promise<FixturePlayersResponse> {
    return this.client.request('/fixtures/players', params, options);
  }
}