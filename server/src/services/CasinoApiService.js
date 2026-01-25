import crypto from 'crypto';
import fetch from 'node-fetch';

const BASE_URL = process.env.CASINO_API_BASE_URL || 'https://staging.slotegrator.com/api/index.php/v1';
const DEFAULT_CURRENCY = process.env.CASINO_DEFAULT_CURRENCY || 'EUR';

// Read env vars dynamically instead of at module load time
function getMerchantId() {
  return process.env.CASINO_MERCHANT_ID;
}

function getMerchantKey() {
  return process.env.CASINO_MERCHANT_KEY;
}

/**
 * Calculate X-Sign signature for Slotegrator API authentication
 * @param {Record<string, any>} params - Request parameters
 * @param {Record<string, string>} headers - Request headers
 * @param {string} merchantKey - Merchant key for signing
 * @returns {string} SHA1 HMAC signature
 */
export function calculateXSign(params, headers, merchantKey) {
  // Merge params and headers
  const mergedParams = { ...params, ...headers };
  
  // Sort by key (ascending)
  const sortedKeys = Object.keys(mergedParams).sort();
  
  // Build query string
  const queryString = sortedKeys
    .map((key) => {
      const value = mergedParams[key];
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join('&');
  
  // Generate SHA1 HMAC
  const signature = crypto
    .createHmac('sha1', merchantKey)
    .update(queryString)
    .digest('hex');
  
  return signature;
}

/**
 * Generate authorization headers for Slotegrator API
 * @returns {Object} Headers object with X-Merchant-Id, X-Timestamp, X-Nonce, X-Sign
 */
function generateAuthHeaders(params = {}) {
  const MERCHANT_ID = getMerchantId();
  const MERCHANT_KEY = getMerchantKey();
  
  if (!MERCHANT_ID || !MERCHANT_KEY) {
    throw new Error('CASINO_MERCHANT_ID and CASINO_MERCHANT_KEY must be configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const headers = {
    'X-Merchant-Id': MERCHANT_ID,
    'X-Timestamp': String(timestamp),
    'X-Nonce': nonce,
  };

  // Calculate X-Sign
  const xSign = calculateXSign(params, headers, MERCHANT_KEY);
  headers['X-Sign'] = xSign;

  return headers;
}

/**
 * Make authenticated request to Slotegrator API
 * @param {string} endpoint - API endpoint (e.g., '/games')
 * @param {Object} options - Request options
 * @returns {Promise<any>} API response
 */
async function makeRequest(endpoint, options = {}) {
  const { method = 'GET', params = {}, body = null } = options;

  // Build URL with query params for GET requests
  let url = `${BASE_URL}${endpoint}`;
  if (method === 'GET' && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url = `${url}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  // Generate auth headers - merge params and body for signature
  const signParams = method === 'GET' ? params : (body || {});
  const authHeaders = generateAuthHeaders(signParams);

  // Prepare headers
  const headers = {
    ...authHeaders,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Build request options
  const requestOptions = {
    method,
    headers,
  };

  // Add body for POST requests
  if (method === 'POST' && body) {
    const formData = new URLSearchParams();
    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined && body[key] !== null) {
        formData.append(key, String(body[key]));
      }
    });
    requestOptions.body = formData.toString();
  }

  // Log request (mask sensitive data)
  console.log('[Casino API Request]', {
    method,
    url,
    headers: { ...authHeaders, 'X-Sign': '***masked***' },
    body: body ? Object.keys(body) : null,
  });

  try {
    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    // Log response
    console.log('[Casino API Response]', {
      status: response.status,
      statusText: response.statusText,
      url,
      body: responseText.substring(0, 500), // First 500 chars
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      const error = new Error(errorData.message || `API error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Parse JSON response
    try {
      return JSON.parse(responseText);
    } catch {
      // Some endpoints return plain text (e.g., 200 OK)
      return { success: true, message: responseText };
    }
  } catch (error) {
    console.error('[Casino API Error]', {
      url,
      method,
      error: error.message,
      status: error.status,
    });
    throw error;
  }
}

class CasinoApiService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get games list with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Games list with pagination metadata
   */
  async getGames(options = {}) {
    const {
      page = 1,
      perPage = 50,
      expand = null, // e.g., 'tags,parameters,images'
    } = options;

    const params = {
      page: String(page),
      perPage: String(perPage),
    };

    if (expand) {
      params.expand = expand;
    }

    return makeRequest('/games', { method: 'GET', params });
  }

  /**
   * Get enabled providers for a currency
   * @param {string} currency - Currency code (e.g., 'EUR', 'USD')
   * @returns {Promise<Set<string>>} Set of enabled provider names
   */
  async getEnabledProviders(currency = DEFAULT_CURRENCY) {
    const cacheKey = `enabled-providers-${currency}`;
    const cached = this.cache.get(cacheKey);
    
    // Cache for 1 hour
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const limits = await makeRequest('/limits', { method: 'GET' });
    
    // Find limits for the currency
    const currencyLimits = limits.find((limit) => limit.currency === currency);
    
    if (!currencyLimits || !currencyLimits.providers) {
      return new Set();
    }

    const providers = new Set(currencyLimits.providers);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: providers,
      expiresAt: Date.now() + 3600000, // 1 hour
    });

    return providers;
  }

  /**
   * Get game lobby data (for games with lobby)
   * @param {string} gameUuid - Game UUID
   * @param {string} currency - Player currency
   * @param {string} technology - Optional: 'html5' or 'flash'
   * @returns {Promise<Object>} Lobby data
   */
  async getGameLobby(gameUuid, currency, technology = null) {
    const params = {
      game_uuid: gameUuid,
      currency: currency,
    };

    if (technology) {
      params.technology = technology;
    }

    return makeRequest('/games/lobby', { method: 'GET', params });
  }

  /**
   * Initialize game session
   * @param {Object} params - Init parameters
   * @returns {Promise<Object>} Launch URL and session info
   */
  async initializeGameSession(params) {
    const {
      gameUuid,
      playerId,
      playerName,
      currency,
      sessionId,
      device = 'desktop', // 'desktop' or 'mobile'
      returnUrl = null,
      language = 'en',
      email = null,
      lobbyData = null,
    } = params;

    const body = {
      game_uuid: gameUuid,
      player_id: playerId,
      player_name: playerName,
      currency: currency,
      session_id: sessionId,
      device: device,
    };

    if (returnUrl) {
      body.return_url = returnUrl;
    }

    if (language) {
      body.language = language;
    }

    if (email) {
      body.email = email;
    }

    if (lobbyData) {
      body.lobby_data = lobbyData;
    }

    return makeRequest('/games/init', { method: 'POST', body });
  }

  /**
   * Initialize demo game session
   * @param {Object} params - Demo init parameters
   * @returns {Promise<Object>} Launch URL
   */
  async initializeDemoGameSession(params) {
    const {
      gameUuid,
      device = 'desktop',
      returnUrl = null,
      language = 'en',
    } = params;

    const body = {
      game_uuid: gameUuid,
      device: device,
    };

    if (returnUrl) {
      body.return_url = returnUrl;
    }

    if (language) {
      body.language = language;
    }

    return makeRequest('/games/init-demo', { method: 'POST', body });
  }

  /**
   * Get merchant limits
   * @returns {Promise<Array>} Limits array
   */
  async getLimits() {
    return makeRequest('/limits', { method: 'GET' });
  }

  /**
   * Get freespin bets for a game
   * @param {string} gameUuid - Game UUID
   * @param {string} currency - Player currency
   * @returns {Promise<Object>} Freespin bets data
   */
  async getFreespinBets(gameUuid, currency) {
    const params = {
      game_uuid: gameUuid,
      currency: currency,
    };

    return makeRequest('/freespins/bets', { method: 'GET', params });
  }

  /**
   * Get game tags
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Game tags list
   */
  async getGameTags(options = {}) {
    const { expand = null } = options;
    const params = {};

    if (expand) {
      params.expand = expand;
    }

    return makeRequest('/game-tags', { method: 'GET', params });
  }

  /**
   * Self-validation endpoint (for testing)
   * @returns {Promise<Object>} Validation result
   */
  async selfValidate() {
    return makeRequest('/self-validate', { method: 'POST' });
  }
}

export default new CasinoApiService();
