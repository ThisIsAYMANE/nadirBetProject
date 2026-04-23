import { ApiFootball } from '../client';
import { CountriesResponse, RequestOptions } from '../types';

export class CountriesEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params?: {
    name?: string;
    code?: string;
    search?: string;
  }, options?: RequestOptions): Promise<CountriesResponse> {
    return this.client.request('/countries', params, options);
  }
}