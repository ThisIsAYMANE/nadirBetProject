import { ApiFootball } from '../client';
import { TransfersResponse, RequestOptions } from '../types';

export class TransfersEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: { player: number }, options?: RequestOptions): Promise<TransfersResponse> {
    return this.client.request('/transfers', params, options);
  }
}