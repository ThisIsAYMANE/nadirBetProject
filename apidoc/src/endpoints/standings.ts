import { ApiFootball } from '../client';
import { StandingsResponse, RequestOptions } from '../types';

export class StandingsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: {
    league?: number;
    season: number;
    team?: number;
  }, options?: RequestOptions): Promise<StandingsResponse> {
    return this.client.request('/standings', params, options);
  }
}