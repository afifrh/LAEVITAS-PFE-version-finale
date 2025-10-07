const axios = require('axios');

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

class CoinGeckoService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: COINGECKO_BASE_URL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Laevitas-Trading-App/1.0'
      }
    });

    // Cache simple en mémoire
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Méthode pour gérer le cache
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Méthode pour gérer les erreurs API
  handleApiError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      
      if (status === 429) {
        throw new Error('Limite de taux API atteinte. Veuillez réessayer dans quelques minutes.');
      } else if (status >= 500) {
        throw new Error('Erreur serveur CoinGecko. Veuillez réessayer plus tard.');
      } else {
        throw new Error(`Erreur CoinGecko API (${status}): ${message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout de la requête API CoinGecko');
    } else {
      throw new Error(`Erreur réseau: ${error.message}`);
    }
  }

  // Récupérer les top cryptomonnaies par market cap
  async getTopCryptocurrencies(limit = 50, currency = 'usd') {
    const params = {
      vs_currency: currency,
      order: 'market_cap_desc',
      per_page: limit,
      page: 1,
      sparkline: true,
      price_change_percentage: '1h,24h,7d'
    };
    
    const cacheKey = this.getCacheKey('/coins/markets', params);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('Données récupérées depuis le cache: top cryptocurrencies');
      return cached;
    }

    try {
      const response = await this.axiosInstance.get('/coins/markets', { params });
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cryptomonnaies:', error.message);
      this.handleApiError(error);
    }
  }

  // Récupérer les données d'une cryptomonnaie spécifique
  async getCryptocurrencyDetails(coinId) {
    try {
      const response = await this.axiosInstance.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: true
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de ${coinId}:`, error.message);
      throw new Error(`Erreur CoinGecko API: ${error.message}`);
    }
  }

  // Récupérer les données historiques de prix
  async getHistoricalPrices(coinId, days = 30, currency = 'usd') {
    try {
      const response = await this.axiosInstance.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: currency,
          days: days,
          interval: 'daily'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique de ${coinId}:`, error.message);
      throw new Error(`Erreur CoinGecko API: ${error.message}`);
    }
  }

  // Récupérer les données globales du marché crypto
  async getGlobalMarketData() {
    const cacheKey = this.getCacheKey('/global');
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('Données récupérées depuis le cache: global market data');
      return cached;
    }

    try {
      const response = await this.axiosInstance.get('/global');
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données globales:', error.message);
      this.handleApiError(error);
    }
  }

  // Rechercher des cryptomonnaies
  async searchCryptocurrencies(query) {
    try {
      const response = await this.axiosInstance.get('/search', {
        params: {
          query: query
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error.message);
      throw new Error(`Erreur CoinGecko API: ${error.message}`);
    }
  }

  // Récupérer les trending coins
  async getTrendingCoins() {
    const cacheKey = this.getCacheKey('/search/trending');
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('Données récupérées depuis le cache: trending coins');
      return cached;
    }

    try {
      const response = await this.axiosInstance.get('/search/trending');
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des trending coins:', error.message);
      this.handleApiError(error);
    }
  }

  // Récupérer les exchanges
  async getExchanges() {
    try {
      const response = await this.axiosInstance.get('/exchanges', {
        params: {
          per_page: 50,
          page: 1
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des exchanges:', error.message);
      throw new Error(`Erreur CoinGecko API: ${error.message}`);
    }
  }
}

module.exports = new CoinGeckoService();