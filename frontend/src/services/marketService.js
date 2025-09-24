import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';

class MarketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map(); // Map<symbol, Set<callback>>
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.subscriptions = new Set();
    this.heartbeatInterval = null;
  }

  // ==================== API METHODS ====================

  // Obtenir la liste des marchés
  async getMarkets(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort) params.append('sort', filters.sort);

      const response = await axios.get(`${API_BASE_URL}/markets?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des marchés:', error);
      throw this.handleError(error);
    }
  }

  // Obtenir les marchés populaires
  async getPopularMarkets(limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des marchés populaires:', error);
      throw this.handleError(error);
    }
  }

  // Obtenir les types de marchés
  async getMarketTypes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets/types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types:', error);
      throw this.handleError(error);
    }
  }

  // Obtenir les détails d'un marché
  async getMarketDetails(symbol) {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets/${symbol.toUpperCase()}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du marché ${symbol}:`, error);
      throw this.handleError(error);
    }
  }

  // Obtenir le ticker d'un marché
  async getTicker(symbol) {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets/${symbol.toUpperCase()}/ticker`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du ticker ${symbol}:`, error);
      throw this.handleError(error);
    }
  }

  // ==================== WATCHLIST METHODS ====================

  // Obtenir les watchlists de l'utilisateur
  async getWatchlists() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/markets/user/watchlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des watchlists:', error);
      throw this.handleError(error);
    }
  }

  // Créer une nouvelle watchlist
  async createWatchlist(data) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/markets/user/watchlists`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la watchlist:', error);
      throw this.handleError(error);
    }
  }

  // Obtenir une watchlist spécifique
  async getWatchlist(id) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/markets/user/watchlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la watchlist:', error);
      throw this.handleError(error);
    }
  }

  // Mettre à jour une watchlist
  async updateWatchlist(id, data) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_BASE_URL}/markets/user/watchlists/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la watchlist:', error);
      throw this.handleError(error);
    }
  }

  // Supprimer une watchlist
  async deleteWatchlist(id) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_BASE_URL}/markets/user/watchlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la watchlist:', error);
      throw this.handleError(error);
    }
  }

  // Ajouter un marché à une watchlist
  async addToWatchlist(watchlistId, symbol, options = {}) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/markets/user/watchlists/${watchlistId}/items`,
        { symbol, ...options },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la watchlist:', error);
      throw this.handleError(error);
    }
  }

  // Supprimer un marché d'une watchlist
  async removeFromWatchlist(watchlistId, symbol) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `${API_BASE_URL}/markets/user/watchlists/${watchlistId}/items/${symbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la watchlist:', error);
      throw this.handleError(error);
    }
  }

  // Ajouter une alerte
  async addAlert(watchlistId, symbol, alertData) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/markets/user/watchlists/${watchlistId}/items/${symbol}/alerts`,
        alertData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'alerte:', error);
      throw this.handleError(error);
    }
  }

  // ==================== WEBSOCKET METHODS ====================

  // Se connecter au WebSocket
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('Token d\'authentification manquant');
        }

        const wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connecté');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket fermé:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (event.code !== 1000) { // Pas une fermeture normale
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erreur WebSocket:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Gérer les messages WebSocket
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connection':
          console.log('✅ Connexion WebSocket confirmée:', message.clientId);
          break;
          
        case 'ticker':
          this.notifySubscribers(message.symbol, message.data);
          break;
          
        case 'market_data':
          message.data.forEach(market => {
            this.notifySubscribers(market.symbol, market.marketData);
          });
          break;
          
        case 'subscription_success':
          console.log('✅ Abonnement réussi:', message.symbols);
          break;
          
        case 'unsubscription_success':
          console.log('✅ Désabonnement réussi:', message.symbols);
          break;
          
        case 'error':
          console.error('❌ Erreur WebSocket:', message.message);
          break;
          
        case 'pong':
          // Heartbeat reçu
          break;
          
        default:
          console.log('📨 Message WebSocket non géré:', message);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message WebSocket:', error);
    }
  }

  // Notifier les abonnés
  notifySubscribers(symbol, data) {
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erreur lors de la notification:', error);
        }
      });
    }
  }

  // S'abonner aux mises à jour d'un symbole
  subscribe(symbol, callback) {
    const normalizedSymbol = symbol.toUpperCase();
    
    if (!this.subscribers.has(normalizedSymbol)) {
      this.subscribers.set(normalizedSymbol, new Set());
    }
    
    this.subscribers.get(normalizedSymbol).add(callback);
    this.subscriptions.add(normalizedSymbol);

    // Envoyer l'abonnement au serveur
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbols: [normalizedSymbol],
        channels: ['ticker']
      }));
    }

    // Retourner une fonction de désabonnement
    return () => this.unsubscribe(normalizedSymbol, callback);
  }

  // Se désabonner des mises à jour d'un symbole
  unsubscribe(symbol, callback) {
    const normalizedSymbol = symbol.toUpperCase();
    const subscribers = this.subscribers.get(normalizedSymbol);
    
    if (subscribers) {
      subscribers.delete(callback);
      
      if (subscribers.size === 0) {
        this.subscribers.delete(normalizedSymbol);
        this.subscriptions.delete(normalizedSymbol);
        
        // Envoyer le désabonnement au serveur
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'unsubscribe',
            symbols: [normalizedSymbol],
            channels: ['ticker']
          }));
        }
      }
    }
  }

  // S'abonner à plusieurs symboles
  subscribeToMultiple(symbols, callback) {
    const unsubscribeFunctions = symbols.map(symbol => 
      this.subscribe(symbol, callback)
    );
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  // Gérer la reconnexion automatique
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
    
    setTimeout(() => {
      this.connectWebSocket().then(() => {
        // Réabonner aux symboles précédents
        if (this.subscriptions.size > 0) {
          this.ws.send(JSON.stringify({
            type: 'subscribe',
            symbols: Array.from(this.subscriptions),
            channels: ['ticker']
          }));
        }
      }).catch(error => {
        console.error('Erreur lors de la reconnexion:', error);
      });
    }, delay);
  }

  // Démarrer le heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping toutes les 30 secondes
  }

  // Arrêter le heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Fermer la connexion WebSocket
  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Déconnexion normale');
      this.ws = null;
    }
    
    this.subscribers.clear();
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
  }

  // ==================== UTILITY METHODS ====================

  // Formater le prix
  formatPrice(price, precision = 8) {
    if (typeof price !== 'number') return '0.00';
    
    if (price >= 1) {
      return price.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: Math.min(precision, 8)
      });
    } else {
      return price.toFixed(precision);
    }
  }

  // Formater le volume
  formatVolume(volume) {
    if (typeof volume !== 'number') return '0';
    
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(2)}K`;
    } else {
      return volume.toFixed(0);
    }
  }

  // Formater le pourcentage de changement
  formatChangePercent(changePercent) {
    if (typeof changePercent !== 'number') return '0.00%';
    
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  // Obtenir la couleur selon le changement
  getChangeColor(changePercent) {
    if (typeof changePercent !== 'number') return 'text-gray-500';
    
    if (changePercent > 0) return 'text-green-500';
    if (changePercent < 0) return 'text-red-500';
    return 'text-gray-500';
  }

  // Valider un symbole
  validateSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      return false;
    }
    
    const normalizedSymbol = symbol.trim().toUpperCase();
    return /^[A-Z0-9]{2,20}$/.test(normalizedSymbol);
  }

  // Gérer les erreurs API
  handleError(error) {
    if (error.response) {
      // Erreur de réponse du serveur
      return {
        message: error.response.data?.message || 'Erreur serveur',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: 'Erreur de connexion au serveur',
        status: 0,
        data: null
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Erreur inconnue',
        status: -1,
        data: null
      };
    }
  }

  // Obtenir le statut de la connexion
  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

export default new MarketService();