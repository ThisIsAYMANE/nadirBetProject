import { ApiFootball } from '../client';
import { LeaguesResponse, SeasonsResponse, RequestOptions } from '../types';

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
  }, options?: RequestOptions): Promise<LeaguesResponse> {
    return this.client.request('/leagues', params, options);
  }

  async getSeasons(options?: RequestOptions): Promise<SeasonsResponse> {
    return this.client.request('/leagues/seasons', undefined, options);
  }
}