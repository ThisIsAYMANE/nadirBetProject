import { ApiFootball } from '../client';
import { SidelinedResponse, RequestOptions } from '../types';

export class SidelinedEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    player?: number;
    coach?: number;
    players?: string;
    coachs?: string;
  }, options?: RequestOptions): Promise<SidelinedResponse> {
    return this.client.request('/sidelined', params, options);
  }
}