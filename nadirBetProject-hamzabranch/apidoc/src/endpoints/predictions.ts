import { ApiFootball } from '../client';
import { PredictionsResponse, RequestOptions } from '../types';

export class PredictionsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: { fixture: number }, options?: RequestOptions): Promise<PredictionsResponse> {
    return this.client.request('/predictions', params, options);
  }
}