// Service API CoinGecko pour les données de cryptomonnaies (via proxy backend)
const COINGECKO_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/coingecko';

class CoinGeckoService {
  // Récupérer les top cryptomonnaies par market cap
  async getTopCryptocurrencies(limit = 50, currency = 'usd') {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error('Erreur lors de la récupération des cryptomonnaies:', error);
      throw error;
    }
  }

  // Récupérer les données d'une cryptomonnaie spécifique
  async getCryptocurrencyDetails(coinId) {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de ${coinId}:`, error);
      throw error;
    }
  }

  // Récupérer les données historiques de prix
  async getHistoricalPrices(coinId, days = 30, currency = 'usd') {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=daily`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique de ${coinId}:`, error);
      throw error;
    }
  }

  // Récupérer les données globales du marché crypto
  async getGlobalMarketData() {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/global`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error('Erreur lors de la récupération des données globales:', error);
      throw error;
    }
  }

  // Rechercher des cryptomonnaies
  async searchCryptocurrencies(query) {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  }

  // Récupérer les trending coins
  async getTrendingCoins() {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/search/trending`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error('Erreur lors de la récupération des trending coins:', error);
      throw error;
    }
  }

  // Récupérer les exchanges
  async getExchanges() {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/exchanges?per_page=50&page=1`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result; // Support pour les réponses du proxy backend
    } catch (error) {
      console.error('Erreur lors de la récupération des exchanges:', error);
      throw error;
    }
  }

  // Formater les données pour l'affichage
  formatCurrencyData(data) {
    return data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      fullyDilutedValuation: coin.fully_diluted_valuation,
      totalVolume: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      priceChange24h: coin.price_change_24h,
      priceChangePercentage24h: coin.price_change_percentage_24h,
      priceChangePercentage1h: coin.price_change_percentage_1h_in_currency,
      priceChangePercentage7d: coin.price_change_percentage_7d_in_currency,
      marketCapChange24h: coin.market_cap_change_24h,
      marketCapChangePercentage24h: coin.market_cap_change_percentage_24h,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      ath: coin.ath,
      athChangePercentage: coin.ath_change_percentage,
      athDate: coin.ath_date,
      atl: coin.atl,
      atlChangePercentage: coin.atl_change_percentage,
      atlDate: coin.atl_date,
      lastUpdated: coin.last_updated,
      sparklineIn7d: coin.sparkline_in_7d?.price || []
    }));
  }
}

export default new CoinGeckoService();