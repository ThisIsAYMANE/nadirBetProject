import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getConfig, validateConfig, ApiFootballConfig } from './config';
import { MemoryCache } from './cache/memory';
import { RateLimiter } from './cache/rateLimiter';
import { ApiError, RateLimitError, AuthenticationError, handleApiError } from './errors';
import { RequestOptions, TimezoneResponse, CountriesResponse, StatusResponse } from './types';

export class ApiFootball {
  private client: AxiosInstance;
  private cache: MemoryCache;
  private rateLimiter: RateLimiter;
  private config: ReturnType<typeof getConfig>;

  constructor(config: ApiFootballConfig) {
    validateConfig(config);
    this.config = getConfig(config);

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'x-apisports-key': this.config.apiKey,
      },
    });

    this.cache = new MemoryCache(this.config.cacheTTL);
    this.rateLimiter = new RateLimiter();
    this.rateLimiter.setBuffer(this.config.rateLimitBuffer);

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.rateLimiter.updateFromHeaders(response.headers as Record<string, string>);
        return response;
      },
      (error: unknown) => {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 429) {
            throw new RateLimitError('Rate limit exceeded');
          }
          if (axiosError.response?.status === 401) {
            throw new AuthenticationError();
          }
        }
        throw handleApiError(error);
      }
    );
  }

  async request<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const shouldCache = options?.cache !== false;
    const customTTL = options?.cacheTTL;

    const cacheKey = this.cache.generateKey(endpoint, params);

    if (shouldCache && this.cache.has(cacheKey)) {
      return this.cache.get<T>(cacheKey)!;
    }

    await this.rateLimiter.waitIfNeeded();

    try {
      const response = await this.client.get<T>(endpoint, {
        params,
      });

      if (shouldCache) {
        this.cache.set(cacheKey, response.data, customTTL);
      }

      return response.data;
    } catch (error) {
      if (error instanceof RateLimitError) {
        await this.rateLimiter.waitIfNeeded();
        const response = await this.client.get<T>(endpoint, { params });
        if (shouldCache) {
          this.cache.set(cacheKey, response.data, customTTL);
        }
        return response.data;
      }
      throw error;
    }
  }

  async getTimezone(): Promise<TimezoneResponse> {
    return this.request('/timezone');
  }

  async getCountries(params?: { name?: string; code?: string; search?: string }): Promise<CountriesResponse> {
    return this.request('/countries', params);
  }

  async getStatus(): Promise<StatusResponse> {
    return this.request('/status');
  }

  getRateLimitInfo() {
    return this.rateLimiter.getRateLimitInfo();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default ApiFootball;