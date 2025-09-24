// Service centralisé pour toutes les APIs de trading
import CoinGeckoService from './coinGeckoApi';
import AlphaVantageService from './alphaVantageApi';

class TradingService {
  constructor() {
    this.coinGecko = CoinGeckoService;
    this.alphaVantage = AlphaVantageService;
  }

  // === CRYPTOMONNAIES ===

  // Récupérer le portfolio crypto avec les top coins
  async getCryptoPortfolio(limit = 20) {
    try {
      const [topCoins, globalData, trending] = await Promise.all([
        this.coinGecko.getTopCryptocurrencies(limit),
        this.coinGecko.getGlobalMarketData(),
        this.coinGecko.getTrendingCoins()
      ]);

      return {
        topCoins: this.coinGecko.formatCurrencyData(topCoins),
        globalData: globalData.data,
        trending: trending.coins
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du portfolio crypto:', error);
      throw error;
    }
  }

  // Récupérer les détails d'une crypto avec historique
  async getCryptoDetails(coinId, days = 30) {
    try {
      const [details, history] = await Promise.all([
        this.coinGecko.getCryptocurrencyDetails(coinId),
        this.coinGecko.getHistoricalPrices(coinId, days)
      ]);

      return {
        details,
        priceHistory: history.prices,
        volumeHistory: history.total_volumes,
        marketCapHistory: history.market_caps
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de ${coinId}:`, error);
      throw error;
    }
  }

  // === ACTIONS ===

  // Récupérer les données d'une action avec indicateurs techniques
  async getStockData(symbol, period = 'daily') {
    try {
      let stockData;
      
      switch (period) {
        case 'intraday':
          stockData = await this.alphaVantage.getStockIntraday(symbol);
          break;
        case 'weekly':
          stockData = await this.alphaVantage.getStockWeekly(symbol);
          break;
        case 'monthly':
          stockData = await this.alphaVantage.getStockMonthly(symbol);
          break;
        default:
          stockData = await this.alphaVantage.getStockDaily(symbol);
      }

      // Récupérer les indicateurs techniques en parallèle
      const [rsi, macd, bollinger] = await Promise.allSettled([
        this.alphaVantage.getRSI(symbol),
        this.alphaVantage.getMACD(symbol),
        this.alphaVantage.getBollingerBands(symbol)
      ]);

      return {
        stockData,
        technicalIndicators: {
          rsi: rsi.status === 'fulfilled' ? rsi.value : null,
          macd: macd.status === 'fulfilled' ? macd.value : null,
          bollinger: bollinger.status === 'fulfilled' ? bollinger.value : null
        }
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de ${symbol}:`, error);
      throw error;
    }
  }

  // === FOREX ===

  // Récupérer les données forex principales
  async getForexData() {
    try {
      const majorPairs = [
        { from: 'EUR', to: 'USD' },
        { from: 'GBP', to: 'USD' },
        { from: 'USD', to: 'JPY' },
        { from: 'USD', to: 'CHF' },
        { from: 'AUD', to: 'USD' },
        { from: 'USD', to: 'CAD' }
      ];

      const forexPromises = majorPairs.map(pair => 
        this.alphaVantage.getForexDaily(pair.from, pair.to)
          .then(data => ({
            pair: `${pair.from}/${pair.to}`,
            data: this.alphaVantage.formatForexData(data, 'Time Series (Daily)')
          }))
          .catch(error => ({
            pair: `${pair.from}/${pair.to}`,
            error: error.message
          }))
      );

      const results = await Promise.all(forexPromises);
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des données forex:', error);
      throw error;
    }
  }

  // === RECHERCHE ===

  // Recherche unifiée (crypto + stocks)
  async searchAssets(query) {
    try {
      const [cryptoResults, stockResults] = await Promise.allSettled([
        this.coinGecko.searchCryptocurrencies(query),
        this.alphaVantage.searchSymbols(query)
      ]);

      return {
        cryptocurrencies: cryptoResults.status === 'fulfilled' ? cryptoResults.value.coins : [],
        stocks: stockResults.status === 'fulfilled' ? stockResults.value.bestMatches : []
      };
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  }

  // === DONNÉES DE MARCHÉ ===

  // Récupérer un aperçu complet du marché
  async getMarketOverview() {
    try {
      const [cryptoData, trending] = await Promise.all([
        this.getCryptoPortfolio(10),
        this.coinGecko.getTrendingCoins()
      ]);

      // Quelques actions populaires pour le dashboard
      const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      const stockPromises = popularStocks.map(symbol => 
        this.alphaVantage.getStockDaily(symbol)
          .then(data => ({
            symbol,
            data: this.alphaVantage.formatTimeSeriesData(data, 'Time Series (Daily)').slice(-1)[0] // Dernier jour
          }))
          .catch(error => ({
            symbol,
            error: error.message
          }))
      );

      const stockData = await Promise.allSettled(stockPromises);

      return {
        crypto: cryptoData,
        stocks: stockData.map(result => result.status === 'fulfilled' ? result.value : null).filter(Boolean),
        trending: trending.coins
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'aperçu du marché:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===

  // Formater les nombres pour l'affichage
  formatCurrency(value, currency = 'USD', decimals = 2) {
    if (value === null || value === undefined) return 'N/A';
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  // Formater les pourcentages
  formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined) return 'N/A';
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  // Formater les gros nombres (K, M, B)
  formatLargeNumber(value) {
    if (value === null || value === undefined) return 'N/A';
    
    const absValue = Math.abs(value);
    
    if (absValue >= 1e12) {
      return (value / 1e12).toFixed(2) + 'T';
    } else if (absValue >= 1e9) {
      return (value / 1e9).toFixed(2) + 'B';
    } else if (absValue >= 1e6) {
      return (value / 1e6).toFixed(2) + 'M';
    } else if (absValue >= 1e3) {
      return (value / 1e3).toFixed(2) + 'K';
    }
    
    return value.toFixed(2);
  }

  // Déterminer la couleur selon le changement de prix
  getPriceChangeColor(change) {
    if (change > 0) return '#10b981'; // Vert
    if (change < 0) return '#ef4444'; // Rouge
    return '#6b7280'; // Gris
  }
}

export default new TradingService();