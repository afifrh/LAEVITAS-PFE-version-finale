const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Market = require('../models/Market');
const Watchlist = require('../models/Watchlist');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map<clientId, { ws, userId, subscriptions }>
    this.marketDataInterval = null;
    this.priceSimulationInterval = null;
    this.isRunning = false;
  }

  // Initialiser le serveur WebSocket
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startMarketDataBroadcast();
    this.startPriceSimulation();
    this.isRunning = true;

    console.log('🔌 Service WebSocket initialisé');
  }

  // Vérifier l'authentification du client
  verifyClient(info) {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.error('Erreur d\'authentification WebSocket:', error);
      return false;
    }
  }

  // Gérer une nouvelle connexion
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const userId = req.user.userId;

    const client = {
      ws,
      userId,
      subscriptions: new Set(),
      lastPing: Date.now(),
      isAlive: true
    };

    this.clients.set(clientId, client);

    console.log(`📱 Client connecté: ${clientId} (User: ${userId})`);

    // Configuration des événements WebSocket
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
    ws.on('pong', () => this.handlePong(clientId));

    // Envoyer un message de bienvenue
    this.sendToClient(clientId, {
      type: 'connection',
      status: 'connected',
      clientId,
      timestamp: new Date().toISOString()
    });

    // Charger automatiquement les watchlists de l'utilisateur
    this.loadUserWatchlists(clientId, userId);
  }

  // Gérer les messages reçus
  async handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          await this.handleSubscribe(clientId, message);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribe(clientId, message);
          break;
        case 'ping':
          this.handlePing(clientId);
          break;
        case 'get_market_data':
          await this.handleGetMarketData(clientId, message);
          break;
        case 'get_ticker':
          await this.handleGetTicker(clientId, message);
          break;
        default:
          this.sendError(clientId, 'Type de message non supporté');
      }
    } catch (error) {
      console.error(`Erreur lors du traitement du message (${clientId}):`, error);
      this.sendError(clientId, 'Erreur lors du traitement du message');
    }
  }

  // Gérer les abonnements
  async handleSubscribe(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { symbols, channels = ['ticker'] } = message;
    
    if (!Array.isArray(symbols)) {
      return this.sendError(clientId, 'Symbols doit être un tableau');
    }

    // Vérifier que les symboles existent
    const validSymbols = await Market.find({
      symbol: { $in: symbols.map(s => s.toUpperCase()) },
      status: 'active'
    }).distinct('symbol');

    for (const symbol of validSymbols) {
      for (const channel of channels) {
        const subscription = `${symbol}:${channel}`;
        client.subscriptions.add(subscription);
      }
    }

    this.sendToClient(clientId, {
      type: 'subscription_success',
      symbols: validSymbols,
      channels,
      timestamp: new Date().toISOString()
    });

    // Envoyer immédiatement les données actuelles
    await this.sendCurrentMarketData(clientId, validSymbols);
  }

  // Gérer les désabonnements
  async handleUnsubscribe(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { symbols, channels = ['ticker'] } = message;

    if (symbols === 'all') {
      client.subscriptions.clear();
    } else if (Array.isArray(symbols)) {
      for (const symbol of symbols) {
        for (const channel of channels) {
          const subscription = `${symbol.toUpperCase()}:${channel}`;
          client.subscriptions.delete(subscription);
        }
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscription_success',
      symbols: symbols === 'all' ? 'all' : symbols,
      channels,
      timestamp: new Date().toISOString()
    });
  }

  // Gérer le ping
  handlePing(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
      client.isAlive = true;
      this.sendToClient(clientId, {
        type: 'pong',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Gérer le pong
  handlePong(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.isAlive = true;
    }
  }

  // Obtenir les données de marché
  async handleGetMarketData(clientId, message) {
    const { symbols } = message;
    
    if (!Array.isArray(symbols)) {
      return this.sendError(clientId, 'Symbols doit être un tableau');
    }

    const markets = await Market.find({
      symbol: { $in: symbols.map(s => s.toUpperCase()) },
      status: 'active'
    }).lean();

    this.sendToClient(clientId, {
      type: 'market_data',
      data: markets.map(market => ({
        symbol: market.symbol,
        marketData: market.marketData,
        timestamp: new Date().toISOString()
      }))
    });
  }

  // Obtenir le ticker
  async handleGetTicker(clientId, message) {
    const { symbol } = message;
    
    const market = await Market.findOne({
      symbol: symbol.toUpperCase(),
      status: 'active'
    }).select('symbol marketData').lean();

    if (!market) {
      return this.sendError(clientId, 'Marché non trouvé');
    }

    this.sendToClient(clientId, {
      type: 'ticker',
      symbol: market.symbol,
      data: market.marketData,
      timestamp: new Date().toISOString()
    });
  }

  // Charger les watchlists de l'utilisateur
  async loadUserWatchlists(clientId, userId) {
    try {
      const watchlists = await Watchlist.findByUserId(userId);
      const allSymbols = new Set();

      watchlists.forEach(watchlist => {
        watchlist.items.forEach(item => {
          allSymbols.add(item.symbol);
        });
      });

      if (allSymbols.size > 0) {
        await this.handleSubscribe(clientId, {
          type: 'subscribe',
          symbols: Array.from(allSymbols),
          channels: ['ticker']
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des watchlists:', error);
    }
  }

  // Envoyer les données de marché actuelles
  async sendCurrentMarketData(clientId, symbols) {
    try {
      const markets = await Market.find({
        symbol: { $in: symbols },
        status: 'active'
      }).lean();

      for (const market of markets) {
        this.sendToClient(clientId, {
          type: 'ticker',
          symbol: market.symbol,
          data: market.marketData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des données actuelles:', error);
    }
  }

  // Gérer la déconnexion
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`📱 Client déconnecté: ${clientId}`);
      this.clients.delete(clientId);
    }
  }

  // Gérer les erreurs
  handleError(clientId, error) {
    console.error(`Erreur WebSocket pour le client ${clientId}:`, error);
    this.handleDisconnection(clientId);
  }

  // Envoyer un message à un client spécifique
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${clientId}:`, error);
        this.handleDisconnection(clientId);
      }
    }
  }

  // Envoyer une erreur à un client
  sendError(clientId, message) {
    this.sendToClient(clientId, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Diffuser à tous les clients abonnés à un symbole
  broadcastToSubscribers(symbol, channel, data) {
    const subscription = `${symbol}:${channel}`;
    
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(subscription)) {
        this.sendToClient(clientId, {
          type: channel,
          symbol,
          data,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Démarrer la diffusion des données de marché
  startMarketDataBroadcast() {
    this.marketDataInterval = setInterval(async () => {
      try {
        // Obtenir tous les symboles avec des abonnements actifs
        const subscribedSymbols = new Set();
        this.clients.forEach(client => {
          client.subscriptions.forEach(sub => {
            const [symbol] = sub.split(':');
            subscribedSymbols.add(symbol);
          });
        });

        if (subscribedSymbols.size === 0) return;

        // Récupérer les données de marché
        const markets = await Market.find({
          symbol: { $in: Array.from(subscribedSymbols) },
          status: 'active'
        }).lean();

        // Diffuser les mises à jour
        markets.forEach(market => {
          this.broadcastToSubscribers(market.symbol, 'ticker', market.marketData);
        });

      } catch (error) {
        console.error('Erreur lors de la diffusion des données:', error);
      }
    }, 1000); // Mise à jour chaque seconde
  }

  // Simuler les changements de prix
  startPriceSimulation() {
    this.priceSimulationInterval = setInterval(async () => {
      try {
        const markets = await Market.find({ status: 'active' });
        
        for (const market of markets) {
          // Simuler un changement de prix aléatoire (-2% à +2%)
          const changePercent = (Math.random() - 0.5) * 4;
          const newPrice = market.marketData.lastPrice * (1 + changePercent / 100);
          
          // Mettre à jour les données de marché
          market.marketData.lastPrice = parseFloat(newPrice.toFixed(8));
          market.marketData.changePercent24h = changePercent;
          market.marketData.change24h = market.marketData.lastPrice - market.marketData.open24h;
          
          // Simuler le volume
          market.marketData.volume24h += Math.random() * 1000;
          
          market.marketData.updatedAt = new Date();
          
          await market.save();
        }
      } catch (error) {
        console.error('Erreur lors de la simulation des prix:', error);
      }
    }, 5000); // Mise à jour toutes les 5 secondes
  }

  // Vérifier les connexions actives
  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          console.log(`💔 Client inactif détecté: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, 30000); // Vérification toutes les 30 secondes
  }

  // Générer un ID client unique
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtenir les statistiques
  getStats() {
    const totalClients = this.clients.size;
    const totalSubscriptions = Array.from(this.clients.values())
      .reduce((total, client) => total + client.subscriptions.size, 0);

    return {
      totalClients,
      totalSubscriptions,
      isRunning: this.isRunning,
      uptime: process.uptime()
    };
  }

  // Arrêter le service
  stop() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    
    if (this.priceSimulationInterval) {
      clearInterval(this.priceSimulationInterval);
    }

    this.clients.forEach((client, clientId) => {
      client.ws.close();
    });

    this.clients.clear();
    this.isRunning = false;

    console.log('🔌 Service WebSocket arrêté');
  }
}

module.exports = new WebSocketService();