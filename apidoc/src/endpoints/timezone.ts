import { ApiFootball } from '../client';
import { TimezoneResponse, RequestOptions } from '../types';

export class TimezoneEndpoint {
  constructor(private client: ApiFootball) {}

  async get(options?: RequestOptions): Promise<TimezoneResponse> {
    return this.client.request('/timezone', undefined, options);
  }
}