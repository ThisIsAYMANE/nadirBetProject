import { ApiFootball } from '../client';
import { TeamsResponse, TeamStatisticsResponse, TeamSeasonsResponse, TeamsCountriesResponse, VenueResponse, RequestOptions } from '../types';

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
  }, options?: RequestOptions): Promise<TeamsResponse> {
    return this.client.request('/teams', params, options);
  }

  async getStatistics(params: {
    league: number;
    season: number;
    team: number;
    date?: string;
  }, options?: RequestOptions): Promise<TeamStatisticsResponse> {
    return this.client.request('/teams/statistics', params, options);
  }

  async getSeasons(params: { team: number }, options?: RequestOptions): Promise<TeamSeasonsResponse> {
    return this.client.request('/teams/seasons', params, options);
  }

  async getCountries(options?: RequestOptions): Promise<TeamsCountriesResponse> {
    return this.client.request('/teams/countries', undefined, options);
  }

  async getVenues(params?: {
    id?: number;
    name?: string;
    city?: string;
    country?: string;
    search?: string;
  }, options?: RequestOptions): Promise<VenueResponse> {
    return this.client.request('/venues', params, options);
  }
}