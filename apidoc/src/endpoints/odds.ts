import { ApiFootball } from '../client';
import { OddsResponse, LiveOddsResponse, OddsMappingResponse, BookmakersResponse, BetsResponse, RequestOptions } from '../types';

export class OddsEndpoint {
  constructor(private client: ApiFootball) {}

  async get(params: {
    fixture: number;
    bookmaker?: number;
    bet?: number;
  }, options?: RequestOptions): Promise<OddsResponse> {
    return this.client.request('/odds', params, options);
  }

  async getLive(params?: {
    league?: number;
  }, options?: RequestOptions): Promise<LiveOddsResponse> {
    return this.client.request('/odds/live', params, options);
  }

  async getLiveBets(params?: {
    league?: number;
  }, options?: RequestOptions): Promise<LiveOddsResponse> {
    return this.client.request('/odds/live/bets', params, options);
  }

  async getMapping(options?: RequestOptions): Promise<OddsMappingResponse> {
    return this.client.request('/odds/mapping', undefined, options);
  }

  async getBookmakers(options?: RequestOptions): Promise<BookmakersResponse> {
    return this.client.request('/odds/bookmakers', undefined, options);
  }

  async getBets(options?: RequestOptions): Promise<BetsResponse> {
    return this.client.request('/odds/bets', undefined, options);
  }
}