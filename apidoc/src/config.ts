export interface ApiFootballConfig {
  apiKey: string;
  baseUrl?: string;
  cacheTTL?: number;
  rateLimitBuffer?: number;
}

export const DEFAULT_CONFIG = {
  baseUrl: 'https://v3.football.api-sports.io',
  cacheTTL: 300,
  rateLimitBuffer: 5,
};

export function getConfig(config: ApiFootballConfig): Required<ApiFootballConfig> {
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    cacheTTL: config.cacheTTL ?? DEFAULT_CONFIG.cacheTTL,
    rateLimitBuffer: config.rateLimitBuffer ?? DEFAULT_CONFIG.rateLimitBuffer,
  };
}

export function validateConfig(config: ApiFootballConfig): void {
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
  if (config.cacheTTL !== undefined && config.cacheTTL < 0) {
    throw new Error('Cache TTL must be non-negative');
  }
}