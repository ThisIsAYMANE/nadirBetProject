import { ApiFootball } from '../client';
import { InjuriesResponse, RequestOptions } from '../types';

export class InjuriesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    fixture?: number;
    league?: number;
    season?: number;
    team?: number;
    player?: number;
    ids?: string;
  }, options?: RequestOptions): Promise<InjuriesResponse> {
    return this.client.request('/injuries', params, options);
  }
}