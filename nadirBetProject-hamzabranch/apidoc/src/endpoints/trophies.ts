import { ApiFootball } from '../client';
import { TrophiesResponse, RequestOptions } from '../types';

export class TrophiesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    player?: number;
    coach?: number;
    players?: string;
    coachs?: string;
  }, options?: RequestOptions): Promise<TrophiesResponse> {
    return this.client.request('/trophies', params, options);
  }
}