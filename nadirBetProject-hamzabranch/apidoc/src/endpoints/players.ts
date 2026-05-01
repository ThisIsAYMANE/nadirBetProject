import { ApiFootball } from '../client';
import { PlayersResponse, PlayerSeasonsResponse, PlayerProfilesResponse, PlayerSquadsResponse, PlayerTeamsResponse, TopScorersResponse, TopAssistsResponse, TopYellowCardsResponse, TopRedCardsResponse, RequestOptions } from '../types';

export class PlayersEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    name?: string;
    team?: number;
    league?: number;
    season?: number;
    search?: string;
  }, options?: RequestOptions): Promise<PlayersResponse> {
    return this.client.request('/players', params, options);
  }

  async getSeasons(params: { player: number }, options?: RequestOptions): Promise<PlayerSeasonsResponse> {
    return this.client.request('/players/seasons', params, options);
  }

  async getProfiles(params?: {
    page?: number;
    search?: string;
  }, options?: RequestOptions): Promise<PlayerProfilesResponse> {
    return this.client.request('/players/profiles', params, options);
  }

  async getSquads(params: {
    team: number;
    season?: number;
  }, options?: RequestOptions): Promise<PlayerSquadsResponse> {
    return this.client.request('/players/squads', params, options);
  }

  async getTeams(params: { player: number }, options?: RequestOptions): Promise<PlayerTeamsResponse> {
    return this.client.request('/players/teams', params, options);
  }

  async getTopScorers(params: {
    league?: number;
    season: number;
  }, options?: RequestOptions): Promise<TopScorersResponse> {
    return this.client.request('/players/topscorers', params, options);
  }

  async getTopAssists(params: {
    league?: number;
    season: number;
  }, options?: RequestOptions): Promise<TopAssistsResponse> {
    return this.client.request('/players/topassists', params, options);
  }

  async getTopYellowCards(params: {
    league?: number;
    season: number;
  }, options?: RequestOptions): Promise<TopYellowCardsResponse> {
    return this.client.request('/players/topyellowcards', params, options);
  }

  async getTopRedCards(params: {
    league?: number;
    season: number;
  }, options?: RequestOptions): Promise<TopRedCardsResponse> {
    return this.client.request('/players/topredcards', params, options);
  }
}