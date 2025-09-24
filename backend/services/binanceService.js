const axios = require('axios');
const WebSocket = require('ws');
const Market = require('../models/Market');

class BinanceService {
  constructor() {
    this.baseURL = 'https://api.binance.com/api/v3';
    this.wsBaseURL = 'wss://stream.binance.com:9443/ws';
    this.wsConnections = new Map();
    this.subscribedSymbols = new Set();
  }

  // Récupérer les informations sur tous les symboles
  async getExchangeInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/exchangeInfo`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos d\'échange:', error.message);
      throw error;
    }
  }

  // Récupérer les données de ticker 24h pour tous les symboles
  async get24hrTicker(symbol = null) {
    try {
      const url = symbol 
        ? `${this.baseURL}/ticker/24hr?symbol=${symbol}`
        : `${this.baseURL}/ticker/24hr`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du ticker 24h:', error.message);
      throw error;
    }
  }

  // Récupérer les données de prix actuelles
  async getCurrentPrices(symbols = null) {
    try {
      const url = symbols 
        ? `${this.baseURL}/ticker/price?symbols=${JSON.stringify(symbols)}`
        : `${this.baseURL}/ticker/price`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des prix:', error.message);
      throw error;
    }
  }

  // Récupérer les données de carnet d'ordres
  async getOrderBook(symbol, limit = 100) {
    try {
      const response = await axios.get(`${this.baseURL}/depth?symbol=${symbol}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du carnet d'ordres pour ${symbol}:`, error.message);
      throw error;
    }
  }

  // Récupérer les données de chandelier (klines)
  async getKlines(symbol, interval = '1h', limit = 100) {
    try {
      const response = await axios.get(`${this.baseURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      return response.data.map(kline => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteAssetVolume: parseFloat(kline[7]),
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: parseFloat(kline[9]),
        takerBuyQuoteAssetVolume: parseFloat(kline[10])
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des klines pour ${symbol}:`, error.message);
      throw error;
    }
  }

  // Synchroniser les marchés depuis Binance vers notre base de données
  async syncMarkets() {
    try {
      console.log('🔄 Synchronisation des marchés depuis Binance...');
      
      // Récupérer les informations d'échange et les tickers 24h
      const [exchangeInfo, tickers] = await Promise.all([
        this.getExchangeInfo(),
        this.get24hrTicker()
      ]);

      // Filtrer les symboles USDT populaires
      const usdtSymbols = exchangeInfo.symbols.filter(symbol => 
        symbol.quoteAsset === 'USDT' && 
        symbol.status === 'TRADING' &&
        ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT', 'ATOMUSDT'].includes(symbol.symbol)
      );

      const marketsToUpdate = [];

      for (const symbolInfo of usdtSymbols) {
        const ticker = tickers.find(t => t.symbol === symbolInfo.symbol);
        if (!ticker) continue;

        const marketData = {
          symbol: symbolInfo.symbol,
          baseAsset: symbolInfo.baseAsset,
          quoteAsset: symbolInfo.quoteAsset,
          type: 'crypto',
          category: this.getCategoryBySymbol(symbolInfo.symbol),
          name: this.getNameBySymbol(symbolInfo.baseAsset),
          status: 'active',
          tradingConfig: {
            minOrderSize: this.getMinOrderSize(symbolInfo),
            maxOrderSize: this.getMaxOrderSize(symbolInfo),
            tickSize: this.getTickSize(symbolInfo),
            lotSize: this.getLotSize(symbolInfo),
            fees: {
              maker: 0.001, // 0.1%
              taker: 0.001  // 0.1%
            }
          },
          marketData: {
            lastPrice: parseFloat(ticker.lastPrice),
            bid: parseFloat(ticker.bidPrice),
            ask: parseFloat(ticker.askPrice),
            volume24h: parseFloat(ticker.volume),
            change24h: parseFloat(ticker.priceChange),
            changePercent24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            open24h: parseFloat(ticker.openPrice),
            lastUpdate: new Date()
          },
          metadata: {
            icon: `https://cryptoicons.org/api/icon/${symbolInfo.baseAsset.toLowerCase()}/200`,
            precision: {
              price: this.getPricePrecision(symbolInfo),
              quantity: this.getQuantityPrecision(symbolInfo)
            }
          },
          stats: {
            totalTrades: parseInt(ticker.count),
            totalVolume: parseFloat(ticker.quoteVolume)
          }
        };

        marketsToUpdate.push(marketData);
      }

      // Mettre à jour la base de données
      for (const marketData of marketsToUpdate) {
        await Market.findOneAndUpdate(
          { symbol: marketData.symbol },
          marketData,
          { upsert: true, new: true }
        );
      }

      console.log(`✅ ${marketsToUpdate.length} marchés synchronisés depuis Binance`);
      return marketsToUpdate;

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des marchés:', error.message);
      throw error;
    }
  }

  // Démarrer la connexion WebSocket pour les mises à jour en temps réel
  startRealtimeUpdates(symbols, onUpdate) {
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `${this.wsBaseURL}/${streams}`;

    console.log(`🔌 Connexion WebSocket Binance: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('✅ Connexion WebSocket Binance établie');
    });

    ws.on('message', (data) => {
      try {
        const ticker = JSON.parse(data);
        
        // Si c'est un tableau (plusieurs streams)
        if (Array.isArray(ticker)) {
          ticker.forEach(t => this.processTicker(t, onUpdate));
        } else {
          this.processTicker(ticker, onUpdate);
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message WebSocket:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('Erreur WebSocket Binance:', error);
    });

    ws.on('close', () => {
      console.log('🔌 Connexion WebSocket Binance fermée');
      // Reconnexion automatique après 5 secondes
      setTimeout(() => {
        console.log('🔄 Tentative de reconnexion WebSocket...');
        this.startRealtimeUpdates(symbols, onUpdate);
      }, 5000);
    });

    return ws;
  }

  // Traiter les données de ticker reçues
  processTicker(ticker, onUpdate) {
    const marketUpdate = {
      symbol: ticker.s,
      lastPrice: parseFloat(ticker.c),
      bid: parseFloat(ticker.b),
      ask: parseFloat(ticker.a),
      volume24h: parseFloat(ticker.v),
      change24h: parseFloat(ticker.P),
      changePercent24h: parseFloat(ticker.P),
      high24h: parseFloat(ticker.h),
      low24h: parseFloat(ticker.l),
      open24h: parseFloat(ticker.o),
      lastUpdate: new Date()
    };

    // Mettre à jour la base de données
    Market.findOneAndUpdate(
      { symbol: ticker.s },
      { $set: { marketData: marketUpdate } },
      { new: true }
    ).catch(error => {
      console.error(`Erreur lors de la mise à jour de ${ticker.s}:`, error);
    });

    // Appeler le callback pour notifier les clients
    if (onUpdate) {
      onUpdate(ticker.s, marketUpdate);
    }
  }

  // Méthodes utilitaires
  getCategoryBySymbol(symbol) {
    const majorSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    return majorSymbols.includes(symbol) ? 'major' : 'altcoin';
  }

  getNameBySymbol(baseAsset) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'BNB',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'AVAX': 'Avalanche',
      'MATIC': 'Polygon',
      'ATOM': 'Cosmos'
    };
    return names[baseAsset] || baseAsset;
  }

  getMinOrderSize(symbolInfo) {
    const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
    return lotSizeFilter ? parseFloat(lotSizeFilter.minQty) : 0.00001;
  }

  getMaxOrderSize(symbolInfo) {
    const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
    return lotSizeFilter ? parseFloat(lotSizeFilter.maxQty) : 1000000;
  }

  getTickSize(symbolInfo) {
    const priceFilter = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER');
    return priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
  }

  getLotSize(symbolInfo) {
    const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
    return lotSizeFilter ? parseFloat(lotSizeFilter.stepSize) : 0.00001;
  }

  getPricePrecision(symbolInfo) {
    return symbolInfo.quotePrecision || 8;
  }

  getQuantityPrecision(symbolInfo) {
    return symbolInfo.baseAssetPrecision || 8;
  }
}

module.exports = new BinanceService();