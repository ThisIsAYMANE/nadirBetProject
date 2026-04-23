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
      baseURL: config.baseUrl || 'https://v1.formula-1.api-sports.io',
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
  competitions(params?: { id?: number; name?: string; country?: string; city?: string; search?: string }) { return this.get('/competitions', params); }
  circuits(params?: { id?: number; competition?: number; name?: string; search?: string }) { return this.get('/circuits', params); }
  teams(params?: { id?: number; name?: string; search?: string }) { return this.get('/teams', params); }
  drivers(params?: { id?: number; name?: string; search?: string }) { return this.get('/drivers', params); }
  races(params?: { id?: number; season?: string; competition?: number; circuit?: number; type?: string }) { return this.get('/races', params); }
  rankingsConstructors(params: { season: string }) { return this.get('/rankings/constructors', params); }
  rankingsDrivers(params: { season: string }) { return this.get('/rankings/drivers', params); }
  rankingsFastestLaps(params: { season: string }) { return this.get('/rankings/fastestlaps', params); }
  standings(params: { season: string }) { return this.get('/standings', params); }
}

export default APISports;
