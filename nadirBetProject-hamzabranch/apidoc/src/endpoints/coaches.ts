import { ApiFootball } from '../client';
import { CoachsResponse, RequestOptions } from '../types';

export class CoachesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    id?: number;
    name?: string;
    team?: number;
    search?: string;
  }, options?: RequestOptions): Promise<CoachsResponse> {
    return this.client.request('/coachs', params, options);
  }
}