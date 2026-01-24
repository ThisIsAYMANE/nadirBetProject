import { setTimeout as delay } from 'timers/promises';
import fetch from 'node-fetch';

const BASE_URL = process.env.SPORTS_API_URL || 'https://api.the-odds-api.com/v4';
const DEFAULT_REGION = process.env.SPORTS_API_REGION || 'eu';
const DEFAULT_MARKETS = process.env.SPORTS_API_DEFAULT_MARKETS || 'h2h';
const DEFAULT_ODDS_FORMAT = process.env.SPORTS_API_ODDS_FORMAT || 'decimal';

// Simple in-memory cache with TTL
class OddsAPIService {
  constructor() {
    this.cache = new Map();
    this.defaultRegion = DEFAULT_REGION;
    this.defaultMarkets = DEFAULT_MARKETS;
    this.defaultOddsFormat = DEFAULT_ODDS_FORMAT;
  }

  /**
   * Generic fetch wrapper with basic error handling and small retry.
   */
  async _fetchJson(path, { useCacheKey = null, ttlMs = 0 } = {}) {
    const apiKey = process.env.SPORTS_API_KEY;
    if (!apiKey) {
      throw new Error('SPORTS_API_KEY is not configured in env');
    }

    if (useCacheKey && ttlMs > 0) {
      const cached = this.cache.get(useCacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}apiKey=${apiKey}`;

    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // 429 = rate limit, 5xx = transient
          const text = await res.text();
          const error = new Error(`Odds API error ${res.status}: ${text}`);
          error.status = res.status;
          throw error;
        }

        const data = await res.json();

        if (useCacheKey && ttlMs > 0) {
          this.cache.set(useCacheKey, {
            data,
            expiresAt: Date.now() + ttlMs,
          });
        }

        return data;
      } catch (err) {
        lastError = err;
        // For rate limit or server errors, small backoff then retry once
        if (err.status === 429 || (err.status && err.status >= 500)) {
          await delay(500);
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  /**
   * List all sports/leagues.
   * This does NOT count against quota.
   */
  async getSports({ all = false } = {}) {
    const query = all ? '/sports?all=true' : '/sports';
    const cacheKey = `sports:${all ? 'all' : 'active'}`;
    // Cache for 30 minutes
    return this._fetchJson(query, { useCacheKey: cacheKey, ttlMs: 30 * 60 * 1000 });
  }

  /**
   * Get odds for a sport (upcoming + live).
   */
  async getOddsForSport(sportKey, {
    regions = this.defaultRegion,
    markets = this.defaultMarkets,
    oddsFormat = this.defaultOddsFormat,
    dateFormat = 'iso',
    eventIds = null,
  } = {}) {
    const params = new URLSearchParams({
      regions,
      markets,
      oddsFormat,
      dateFormat,
    });

    if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
      params.set('eventIds', eventIds.join(','));
    }

    const path = `/sports/${encodeURIComponent(sportKey)}/odds?${params.toString()}`;
    const cacheKey = `odds:${sportKey}:${regions}:${markets}:${oddsFormat}`;
    // Cache for 30 seconds to keep odds reasonably fresh
    return this._fetchJson(path, { useCacheKey: cacheKey, ttlMs: 30 * 1000 });
  }

  /**
   * Get scores / results for settlement.
   */
  async getScores(sportKey, {
    daysFrom = 1,
    dateFormat = 'iso',
    eventIds = null,
  } = {}) {
    const params = new URLSearchParams({
      dateFormat,
    });

    if (daysFrom) {
      params.set('daysFrom', String(daysFrom));
    }

    if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
      params.set('eventIds', eventIds.join(','));
    }

    const path = `/sports/${encodeURIComponent(sportKey)}/scores?${params.toString()}`;
    const cacheKey = `scores:${sportKey}:${daysFrom}`;
    // Cache for 60 seconds
    return this._fetchJson(path, { useCacheKey: cacheKey, ttlMs: 60 * 1000 });
  }

  /**
   * Get fixtures/events without odds.
   * This does NOT count against quota.
   */
  async getEvents(sportKey, {
    commenceTimeFrom,
    commenceTimeTo,
    dateFormat = 'iso',
  } = {}) {
    const params = new URLSearchParams({
      dateFormat,
    });

    if (commenceTimeFrom) params.set('commenceTimeFrom', commenceTimeFrom);
    if (commenceTimeTo) params.set('commenceTimeTo', commenceTimeTo);

    const path = `/sports/${encodeURIComponent(sportKey)}/events?${params.toString()}`;
    const cacheKey = `events:${sportKey}:${commenceTimeFrom || ''}:${commenceTimeTo || ''}`;
    // Cache for 5 minutes
    return this._fetchJson(path, { useCacheKey: cacheKey, ttlMs: 5 * 60 * 1000 });
  }

  /**
   * Get odds for a specific event by eventId.
   * This endpoint supports additional markets like btts, draw_no_bet, etc.
   * that are not available on /sports/{sportKey}/odds.
   *
   * @param {string} eventId - The event ID from The Odds API
   * @param {object} options - Query options
   * @param {string} options.regions - Comma-separated regions (default: eu)
   * @param {string} options.markets - Comma-separated markets (default: h2h)
   * @param {string} options.oddsFormat - decimal | american (default: decimal)
   * @param {string} options.dateFormat - iso | unix (default: iso)
   */
  async getOddsForEvent(eventId, {
    regions = this.defaultRegion,
    markets = this.defaultMarkets,
    oddsFormat = this.defaultOddsFormat,
    dateFormat = 'iso',
  } = {}) {
    const params = new URLSearchParams({
      regions,
      markets,
      oddsFormat,
      dateFormat,
    });

    const path = `/events/${encodeURIComponent(eventId)}/odds?${params.toString()}`;
    const cacheKey = `eventOdds:${eventId}:${regions}:${markets}:${oddsFormat}`;
    // Cache for 30 seconds to keep odds reasonably fresh
    return this._fetchJson(path, { useCacheKey: cacheKey, ttlMs: 30 * 1000 });
  }
}

const oddsAPIService = new OddsAPIService();
export default oddsAPIService;

