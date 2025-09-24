const express = require('express');
const router = express.Router();
const binanceService = require('../services/binanceService');
const syncService = require('../services/syncService');
const { wsManager } = require('../websocket/websocketManager');

// Route pour obtenir les données de ticker 24h depuis Binance
router.get('/ticker/:symbol?', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await binanceService.get24hrTicker(symbol);
    
    res.json({
      success: true,
      data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du ticker:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de ticker',
      error: error.message
    });
  }
});

// Route pour obtenir les prix actuels depuis Binance
router.get('/prices/:symbols?', async (req, res) => {
  try {
    const { symbols } = req.params;
    const symbolsArray = symbols ? symbols.split(',') : null;
    const data = await binanceService.getCurrentPrices(symbolsArray);
    
    res.json({
      success: true,
      data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des prix:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des prix',
      error: error.message
    });
  }
});

// Route pour obtenir le carnet d'ordres
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 100 } = req.query;
    
    const data = await binanceService.getOrderBook(symbol, parseInt(limit));
    
    res.json({
      success: true,
      data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du carnet d\'ordres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du carnet d\'ordres',
      error: error.message
    });
  }
});

// Route pour obtenir les données de chandelier (klines)
router.get('/klines/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;
    
    const data = await binanceService.getKlines(symbol, interval, parseInt(limit));
    
    res.json({
      success: true,
      data,
      symbol,
      interval,
      limit: parseInt(limit),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des klines:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de chandelier',
      error: error.message
    });
  }
});

// Route pour synchroniser manuellement les marchés
router.post('/sync', async (req, res) => {
  try {
    const markets = await syncService.manualSync();
    
    res.json({
      success: true,
      message: 'Synchronisation terminée avec succès',
      marketsCount: markets.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation manuelle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation',
      error: error.message
    });
  }
});

// Route pour obtenir le statut du service de synchronisation
router.get('/sync/status', (req, res) => {
  try {
    const status = syncService.getStatus();
    const wsStats = wsManager.getStats();
    
    res.json({
      success: true,
      syncService: status,
      websocket: wsStats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
});

// Route pour démarrer le service de synchronisation
router.post('/sync/start', async (req, res) => {
  try {
    await syncService.start();
    
    res.json({
      success: true,
      message: 'Service de synchronisation démarré',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage du service de synchronisation',
      error: error.message
    });
  }
});

// Route pour arrêter le service de synchronisation
router.post('/sync/stop', (req, res) => {
  try {
    syncService.stop();
    
    res.json({
      success: true,
      message: 'Service de synchronisation arrêté',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'arrêt du service de synchronisation',
      error: error.message
    });
  }
});

// Route pour ajouter un symbole au suivi en temps réel
router.post('/tracking/add/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    syncService.addSymbolToTracking(symbol.toUpperCase());
    
    res.json({
      success: true,
      message: `Symbole ${symbol} ajouté au suivi`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du symbole:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du symbole au suivi',
      error: error.message
    });
  }
});

// Route pour retirer un symbole du suivi en temps réel
router.delete('/tracking/remove/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    syncService.removeSymbolFromTracking(symbol.toUpperCase());
    
    res.json({
      success: true,
      message: `Symbole ${symbol} retiré du suivi`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du symbole:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du symbole du suivi',
      error: error.message
    });
  }
});

module.exports = router;