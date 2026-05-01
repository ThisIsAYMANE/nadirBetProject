import crypto from 'crypto';
import https from 'https';
import http from 'http';

class PragmaticApiService {
  constructor() {
    this.apiUrl = process.env.PRAGMATIC_API_URL || 'https://api.prerelease-env.biz';
    this.secureLogin = process.env.PRAGMATIC_SECURE_LOGIN;
    this.secretKey = process.env.PRAGMATIC_SECRET_KEY;
    this.providerId = process.env.PRAGMATIC_PROVIDER_ID || 'PragmaticPlay';
    
    console.log('🎮 Pragmatic API Service initialized');
    console.log('   API URL:', this.apiUrl);
    console.log('   Secure Login:', this.secureLogin);
    console.log('   Provider ID:', this.providerId);
  }

  /**
   * Generate MD5 hash for API requests
   * @param {Object} params - Parameters to hash
   * @returns {string} - MD5 hash
   */
  generateHash(params) {
    // Sort parameters alphabetically and create query string
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // Append secret key and generate MD5 hash
    const hashString = `${sortedParams}${this.secretKey}`;
    const hash = crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex');
    
    return hash;
  }

  /**
   * Validate hash from Pragmatic webhooks
   * @param {Object} params - Parameters received
   * @param {string} receivedHash - Hash received from Pragmatic
   * @returns {boolean} - Whether hash is valid
   */
  validateHash(params, receivedHash) {
    const expectedHash = this.generateHash(params);
    return expectedHash === receivedHash;
  }

  /**
   * Make HTTP POST request to Pragmatic API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} - Response data
   */
  async makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.apiUrl);
      const postData = JSON.stringify(data);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            // Log raw response for debugging
            console.log('📥 Raw Response Status:', res.statusCode);
            console.log('📥 Raw Response Headers:', JSON.stringify(res.headers, null, 2));
            console.log('📥 Raw Response Body (first 500 chars):', responseData.substring(0, 500));
            
            const parsedData = JSON.parse(responseData);
            
            // Check for API errors
            if (parsedData.error) {
              reject(new Error(`Pragmatic API Error: ${parsedData.error} - ${parsedData.description || ''}`));
            } else {
              resolve(parsedData);
            }
          } catch (error) {
            console.error('❌ Failed to parse JSON. Full response:', responseData);
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Get available games from Pragmatic Play
   * @returns {Promise<Array>} - List of games
   */
  async getAvailableGames() {
    try {
      const params = {
        secureLogin: this.secureLogin,
      };

      // Generate hash
      const hash = this.generateHash(params);

      // Prepare request body
      const requestBody = {
        ...params,
        hash: hash,
      };

      console.log('🎯 Fetching games from Pragmatic API...');
      console.log('   Endpoint: /IntegrationService/v3/http/CasinoGameAPI/getCasinoGames/');
      
      // Make API request
      const response = await this.makeRequest(
        '/IntegrationService/v3/http/CasinoGameAPI/getCasinoGames/',
        requestBody
      );

      // Extract games from response
      const games = response.games || response.gameList || [];
      
      console.log(`✅ Successfully fetched ${games.length} games`);
      
      return games;
    } catch (error) {
      console.error('❌ Error fetching games:', error.message);
      throw error;
    }
  }

  /**
   * Generate game launch URL
   * @param {Object} options - Launch options
   * @returns {Promise<string>} - Game URL
   */
  async generateGameUrl(options) {
    try {
      const {
        playerId,
        externalPlayerId,
        gameId,
        token,
        currency = 'USD',
        language = 'en',
        country = 'US',
        platform = 'WEB',
        cashierUrl,
        lobbyUrl,
      } = options;

      const params = {
        secureLogin: this.secureLogin,
        userId: playerId,
        gameSymbol: gameId,
        currency: currency,
        language: language,
        technology: 'H5', // HTML5
        platform: platform,
        cashierUrl: cashierUrl || '',
        lobbyUrl: lobbyUrl || '',
      };

      // Generate hash
      const hash = this.generateHash(params);

      // Prepare request body
      const requestBody = {
        ...params,
        hash: hash,
      };

      console.log('🎮 Generating game launch URL...');
      console.log('   Game ID:', gameId);
      console.log('   Player ID:', playerId);
      
      // Make API request
      const response = await this.makeRequest(
        '/IntegrationService/v3/http/CasinoGameAPI/gameURL/',
        requestBody
      );

      // Extract game URL from response
      const gameUrl = response.gameURL || response.url;
      
      if (!gameUrl) {
        throw new Error('No game URL returned from Pragmatic API');
      }

      console.log('✅ Game URL generated successfully');
      
      return gameUrl;
    } catch (error) {
      console.error('❌ Error generating game URL:', error.message);
      throw error;
    }
  }

  /**
   * Get game details
   * @param {string} gameId - Game identifier
   * @returns {Promise<Object>} - Game details
   */
  async getGameDetails(gameId) {
    try {
      const params = {
        secureLogin: this.secureLogin,
        gameSymbol: gameId,
      };

      // Generate hash
      const hash = this.generateHash(params);

      // Prepare request body
      const requestBody = {
        ...params,
        hash: hash,
      };

      console.log('🎯 Fetching game details...');
      console.log('   Game ID:', gameId);
      
      // Make API request
      const response = await this.makeRequest(
        '/IntegrationService/v3/http/CasinoGameAPI/gameDetails/',
        requestBody
      );

      console.log('✅ Game details fetched successfully');
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching game details:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export default new PragmaticApiService();
