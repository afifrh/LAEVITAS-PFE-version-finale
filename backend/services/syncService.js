const cron = require('node-cron');
const binanceService = require('./binanceService');
const { broadcastToClients } = require('../websocket/websocketManager');

class SyncService {
  constructor() {
    this.isRunning = false;
    this.syncJob = null;
    this.realtimeWs = null;
    this.trackedSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
      'DOTUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT', 'ATOMUSDT'
    ];
  }

  // Démarrer le service de synchronisation
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Service de synchronisation déjà en cours');
      return;
    }

    console.log('🚀 Démarrage du service de synchronisation...');
    this.isRunning = true;

    try {
      // Synchronisation initiale
      await this.performInitialSync();

      // Programmer les synchronisations périodiques (toutes les 5 minutes)
      this.schedulePeriodicSync();

      // Démarrer les mises à jour en temps réel
      this.startRealtimeUpdates();

      console.log('✅ Service de synchronisation démarré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du service de synchronisation:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Arrêter le service de synchronisation
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Service de synchronisation déjà arrêté');
      return;
    }

    console.log('🛑 Arrêt du service de synchronisation...');

    // Arrêter le job cron
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
    }

    // Fermer la connexion WebSocket
    if (this.realtimeWs) {
      this.realtimeWs.close();
      this.realtimeWs = null;
    }

    this.isRunning = false;
    console.log('✅ Service de synchronisation arrêté');
  }

  // Effectuer la synchronisation initiale
  async performInitialSync() {
    console.log('🔄 Synchronisation initiale des données...');
    
    try {
      const markets = await binanceService.syncMarkets();
      console.log(`✅ Synchronisation initiale terminée: ${markets.length} marchés`);
      
      // Notifier les clients connectés
      broadcastToClients('markets_updated', {
        type: 'initial_sync',
        count: markets.length,
        timestamp: new Date()
      });

      return markets;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation initiale:', error);
      throw error;
    }
  }

  // Programmer les synchronisations périodiques
  schedulePeriodicSync() {
    // Synchronisation toutes les 5 minutes
    this.syncJob = cron.schedule('*/5 * * * *', async () => {
      console.log('⏰ Synchronisation périodique déclenchée');
      
      try {
        const markets = await binanceService.syncMarkets();
        console.log(`✅ Synchronisation périodique terminée: ${markets.length} marchés`);
        
        // Notifier les clients connectés
        broadcastToClients('markets_updated', {
          type: 'periodic_sync',
          count: markets.length,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation périodique:', error);
      }
    });

    console.log('⏰ Synchronisation périodique programmée (toutes les 5 minutes)');
  }

  // Démarrer les mises à jour en temps réel
  startRealtimeUpdates() {
    console.log('🔴 Démarrage des mises à jour en temps réel...');

    this.realtimeWs = binanceService.startRealtimeUpdates(
      this.trackedSymbols,
      this.handleRealtimeUpdate.bind(this)
    );
  }

  // Gérer les mises à jour en temps réel
  handleRealtimeUpdate(symbol, marketData) {
    // Notifier les clients connectés via WebSocket
    broadcastToClients('market_update', {
      symbol,
      data: marketData,
      timestamp: new Date()
    });

    // Log périodique (seulement pour certains symboles pour éviter le spam)
    if (['BTCUSDT', 'ETHUSDT'].includes(symbol)) {
      console.log(`📈 ${symbol}: ${marketData.lastPrice} (${marketData.changePercent24h > 0 ? '+' : ''}${marketData.changePercent24h.toFixed(2)}%)`);
    }
  }

  // Synchronisation manuelle
  async manualSync() {
    console.log('🔄 Synchronisation manuelle déclenchée');
    
    try {
      const markets = await binanceService.syncMarkets();
      console.log(`✅ Synchronisation manuelle terminée: ${markets.length} marchés`);
      
      // Notifier les clients connectés
      broadcastToClients('markets_updated', {
        type: 'manual_sync',
        count: markets.length,
        timestamp: new Date()
      });

      return markets;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation manuelle:', error);
      throw error;
    }
  }

  // Obtenir le statut du service
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasPeriodicSync: !!this.syncJob,
      hasRealtimeUpdates: !!this.realtimeWs,
      trackedSymbols: this.trackedSymbols,
      lastUpdate: new Date()
    };
  }

  // Ajouter un symbole au suivi en temps réel
  addSymbolToTracking(symbol) {
    if (!this.trackedSymbols.includes(symbol)) {
      this.trackedSymbols.push(symbol);
      console.log(`➕ Symbole ${symbol} ajouté au suivi en temps réel`);
      
      // Redémarrer les mises à jour en temps réel si nécessaire
      if (this.isRunning && this.realtimeWs) {
        this.realtimeWs.close();
        setTimeout(() => {
          this.startRealtimeUpdates();
        }, 1000);
      }
    }
  }

  // Retirer un symbole du suivi en temps réel
  removeSymbolFromTracking(symbol) {
    const index = this.trackedSymbols.indexOf(symbol);
    if (index > -1) {
      this.trackedSymbols.splice(index, 1);
      console.log(`➖ Symbole ${symbol} retiré du suivi en temps réel`);
      
      // Redémarrer les mises à jour en temps réel si nécessaire
      if (this.isRunning && this.realtimeWs) {
        this.realtimeWs.close();
        setTimeout(() => {
          this.startRealtimeUpdates();
        }, 1000);
      }
    }
  }
}

module.exports = new SyncService();