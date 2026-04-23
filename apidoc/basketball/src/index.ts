import { AxiosInstance } from 'axios';

export interface ApiSportsConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  get: string;
  parameters: Record<string, unknown>;
  errors: string[];
  results: number;
  response: T;
}

export class APISports {
  private client: AxiosInstance;

  constructor(config: ApiSportsConfig) {
    this.client = require('axios').create({
      baseURL: config.baseUrl || 'https://v1.basketball.api-sports.io',
      headers: { 'x-apisports-key': config.apiKey },
      timeout: config.timeout || 10000
    });
  }

  async get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  timezone() { return this.get<string[]>('/timezone'); }
  seasons() { return this.get<number[]>('/seasons'); }
  countries() { return this.get('/countries'); }
  leagues(params?: { id?: number; season?: string; country?: string }) { return this.get('/leagues', params); }
  teams(params?: { id?: number; league?: number; season?: string; search?: string }) { return this.get('/teams', params); }
  games(params?: { id?: number; date?: string; league?: number; season?: string }) { return this.get('/games', params); }
  standings(params: { league: number; season: string }) { return this.get('/standings', params); }
  players(params?: { team?: number; season?: string; id?: number }) { return this.get('/players', params); }
}

export default APISports;
