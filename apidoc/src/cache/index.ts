import { MemoryCache } from './memory';
import { RateLimiter } from './rateLimiter';

export { MemoryCache, CacheEntry } from './memory';
export { RateLimiter } from './rateLimiter';

export interface CacheOptions {
  enabled?: boolean;
  ttl?: number;
}

export interface CacheModule {
  cache: MemoryCache;
  rateLimiter: RateLimiter;
}

export function createCacheModule(ttl: number = 300): CacheModule {
  return {
    cache: new MemoryCache(ttl),
    rateLimiter: new RateLimiter(),
  };
}