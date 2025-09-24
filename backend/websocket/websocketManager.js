const WebSocket = require('ws');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.subscriptions = new Map(); // clientId -> Set of subscribed symbols
  }

  // Initialiser le serveur WebSocket
  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      ws.clientId = clientId;
      this.clients.add(ws);
      this.subscriptions.set(clientId, new Set());

      console.log(`🔌 Nouveau client WebSocket connecté: ${clientId} (Total: ${this.clients.size})`);

      // Envoyer un message de bienvenue
      this.sendToClient(ws, 'connection', {
        clientId,
        message: 'Connexion WebSocket établie',
        timestamp: new Date()
      });

      // Gérer les messages entrants
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Erreur lors du parsing du message WebSocket:', error);
          this.sendToClient(ws, 'error', {
            message: 'Format de message invalide',
            timestamp: new Date()
          });
        }
      });

      // Gérer la déconnexion
      ws.on('close', () => {
        this.clients.delete(ws);
        this.subscriptions.delete(clientId);
        console.log(`🔌 Client WebSocket déconnecté: ${clientId} (Total: ${this.clients.size})`);
      });

      // Gérer les erreurs
      ws.on('error', (error) => {
        console.error(`Erreur WebSocket pour le client ${clientId}:`, error);
      });

      // Ping périodique pour maintenir la connexion
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping toutes les 30 secondes
    });

    console.log('✅ Serveur WebSocket initialisé');
  }

  // Gérer les messages des clients
  handleClientMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'subscribe':
        this.handleSubscription(ws, payload);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscription(ws, payload);
        break;
      
      case 'ping':
        this.sendToClient(ws, 'pong', { timestamp: new Date() });
        break;
      
      default:
        console.log(`Message WebSocket non géré de type: ${type}`);
        this.sendToClient(ws, 'error', {
          message: `Type de message non supporté: ${type}`,
          timestamp: new Date()
        });
    }
  }

  // Gérer les abonnements aux symboles
  handleSubscription(ws, payload) {
    const { symbols } = payload;
    const clientSubscriptions = this.subscriptions.get(ws.clientId);

    if (Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        clientSubscriptions.add(symbol.toUpperCase());
      });
    } else if (typeof symbols === 'string') {
      clientSubscriptions.add(symbols.toUpperCase());
    }

    this.sendToClient(ws, 'subscription_confirmed', {
      subscribedSymbols: Array.from(clientSubscriptions),
      timestamp: new Date()
    });

    console.log(`📡 Client ${ws.clientId} abonné aux symboles:`, Array.from(clientSubscriptions));
  }

  // Gérer les désabonnements
  handleUnsubscription(ws, payload) {
    const { symbols } = payload;
    const clientSubscriptions = this.subscriptions.get(ws.clientId);

    if (Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        clientSubscriptions.delete(symbol.toUpperCase());
      });
    } else if (typeof symbols === 'string') {
      clientSubscriptions.delete(symbols.toUpperCase());
    }

    this.sendToClient(ws, 'unsubscription_confirmed', {
      subscribedSymbols: Array.from(clientSubscriptions),
      timestamp: new Date()
    });

    console.log(`📡 Client ${ws.clientId} désabonné des symboles:`, Array.from(clientSubscriptions));
  }

  // Envoyer un message à un client spécifique
  sendToClient(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type,
          data,
          timestamp: new Date()
        }));
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message WebSocket:', error);
      }
    }
  }

  // Diffuser un message à tous les clients connectés
  broadcastToAll(type, data) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date()
    });

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Erreur lors de la diffusion:', error);
        }
      }
    });
  }

  // Diffuser une mise à jour de marché aux clients abonnés
  broadcastMarketUpdate(symbol, marketData) {
    const message = JSON.stringify({
      type: 'market_update',
      data: {
        symbol,
        marketData
      },
      timestamp: new Date()
    });

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        const clientSubscriptions = this.subscriptions.get(ws.clientId);
        
        // Envoyer seulement aux clients abonnés à ce symbole
        if (clientSubscriptions && clientSubscriptions.has(symbol.toUpperCase())) {
          try {
            ws.send(message);
          } catch (error) {
            console.error(`Erreur lors de l'envoi de la mise à jour ${symbol} au client ${ws.clientId}:`, error);
          }
        }
      }
    });
  }

  // Générer un ID unique pour le client
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtenir les statistiques du serveur WebSocket
  getStats() {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((total, subs) => total + subs.size, 0);

    return {
      connectedClients: this.clients.size,
      totalSubscriptions,
      subscriptionsByClient: Array.from(this.subscriptions.entries()).map(([clientId, subs]) => ({
        clientId,
        subscriptions: Array.from(subs)
      }))
    };
  }

  // Fermer toutes les connexions
  closeAll() {
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    this.clients.clear();
    this.subscriptions.clear();
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('🔌 Toutes les connexions WebSocket fermées');
  }
}

// Instance singleton
const wsManager = new WebSocketManager();

// Fonction utilitaire pour diffuser aux clients
function broadcastToClients(type, data) {
  wsManager.broadcastToAll(type, data);
}

// Fonction utilitaire pour diffuser les mises à jour de marché
function broadcastMarketUpdate(symbol, marketData) {
  wsManager.broadcastMarketUpdate(symbol, marketData);
}

module.exports = {
  WebSocketManager,
  wsManager,
  broadcastToClients,
  broadcastMarketUpdate
};