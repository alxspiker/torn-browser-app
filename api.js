// api.js - Interface for Torn.com API

/**
 * TornAPI class - Handles all API calls to Torn.com
 */
class TornAPI {
  /**
   * Create a new TornAPI instance
   * @param {string} apiKey - Torn API key
   * @param {Object} options - Configuration options
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.torn.com/v2'; // Updated to v2 API
    this.cache = {};
    this.cacheTimestamps = {};
    this.cacheLifetime = (options.cacheLifetime || 5) * 60 * 1000; // Default 5 minutes
  }

  /**
   * Set API key
   * @param {string} apiKey - New API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Set cache lifetime
   * @param {number} minutes - Cache lifetime in minutes
   */
  setCacheLifetime(minutes) {
    this.cacheLifetime = minutes * 60 * 1000;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
    this.cacheTimestamps = {};
  }

  /**
   * Make a request to the Torn API (v2)
   * @param {string} endpoint - API endpoint (e.g., 'user/bounties', 'user/1234/bounties')
   * @param {Object} params - API query parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - API response
   */
  async request(endpoint, params = {}, bypassCache = false) {
    if (!this.apiKey) {
      return { error: 'API key not set' };
    }

    // Build request URL for v2
    const queryParams = new URLSearchParams({
      key: this.apiKey,
      ...params
    });
    const url = `${this.baseUrl}/${endpoint}?${queryParams}`;
    const cacheKey = url;

    // Check cache if not bypassing
    if (!bypassCache) {
      const now = Date.now();
      if (this.cache[cacheKey] && now - this.cacheTimestamps[cacheKey] < this.cacheLifetime) {
        return this.cache[cacheKey];
      }
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        return { error: data.error };
      }
      this.cache[cacheKey] = data;
      this.cacheTimestamps[cacheKey] = Date.now();
      return data;
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Get user data
   * @param {Object} params - API parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - User data
   */
  async getUserData(params = {}, bypassCache = false) {
    return this.request('user', params, bypassCache);
  }

  /**
   * Get faction data
   * @param {Object} params - API parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - Faction data
   */
  async getFactionData(params = {}, bypassCache = false) {
    return this.request('faction', params, bypassCache);
  }

  /**
   * Get company data
   * @param {Object} params - API parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - Company data
   */
  async getCompanyData(params = {}, bypassCache = false) {
    return this.request('company', params, bypassCache);
  }

  /**
   * Get market data
   * @param {Object} params - API parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - Market data
   */
  async getMarketData(params = {}, bypassCache = false) {
    return this.request('market', params, bypassCache);
  }

  /**
   * Get torn data (items, honors, medals, etc.)
   * @param {Object} params - API parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - Torn data
   */
  async getTornData(params = {}, bypassCache = false) {
    return this.request('torn', params, bypassCache);
  }

  /**
   * Get property data
   * @param {Object} params - API parameters
   * @param {boolean} bypassCache - Whether to bypass the cache
   * @return {Promise<Object>} - Property data
   */
  async getPropertyData(params = {}, bypassCache = false) {
    return this.request('property', params, bypassCache);
  }

  /**
   * Calculate time until energy is full
   * @param {number} currentEnergy - Current energy
   * @param {number} maxEnergy - Maximum energy
   * @param {number} energyInterval - Energy gain interval in seconds (default: 300)
   * @return {number} - Seconds until full energy
   */
  calculateTimeUntilEnergyFull(currentEnergy, maxEnergy, energyInterval = 300) {
    if (currentEnergy >= maxEnergy) return 0;
    const energyNeeded = maxEnergy - currentEnergy;
    return energyNeeded * energyInterval;
  }

  /**
   * Calculate time until nerve is full
   * @param {number} currentNerve - Current nerve
   * @param {number} maxNerve - Maximum nerve
   * @param {number} nerveInterval - Nerve gain interval in seconds (default: 300)
   * @return {number} - Seconds until full nerve
   */
  calculateTimeUntilNerveFull(currentNerve, maxNerve, nerveInterval = 300) {
    if (currentNerve >= maxNerve) return 0;
    const nerveNeeded = maxNerve - currentNerve;
    return nerveNeeded * nerveInterval;
  }
}

// Export TornAPI
module.exports = TornAPI;
