const express = require('express');
const router = express.Router();
const coinGeckoService = require('../services/coinGeckoService');

// Route pour récupérer les top cryptomonnaies
router.get('/coins/markets', async (req, res) => {
  try {
    const { 
      vs_currency = 'usd', 
      per_page = 50, 
      page = 1,
      order = 'market_cap_desc',
      sparkline = 'true',
      price_change_percentage = '1h,24h,7d'
    } = req.query;

    const data = await coinGeckoService.getTopCryptocurrencies(
      parseInt(per_page), 
      vs_currency
    );

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erreur route /coins/markets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des cryptomonnaies'
    });
  }
});

// Route pour récupérer les détails d'une cryptomonnaie
router.get('/coins/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const data = await coinGeckoService.getCryptocurrencyDetails(coinId);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error(`Erreur route /coins/${req.params.coinId}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des détails de la cryptomonnaie'
    });
  }
});

// Route pour récupérer l'historique des prix
router.get('/coins/:coinId/market_chart', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { vs_currency = 'usd', days = 30 } = req.query;
    
    const data = await coinGeckoService.getHistoricalPrices(
      coinId, 
      parseInt(days), 
      vs_currency
    );

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error(`Erreur route /coins/${req.params.coinId}/market_chart:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'historique des prix'
    });
  }
});

// Route pour récupérer les données globales du marché
router.get('/global', async (req, res) => {
  try {
    const data = await coinGeckoService.getGlobalMarketData();

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erreur route /global:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des données globales'
    });
  }
});

// Route pour rechercher des cryptomonnaies
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre query est requis'
      });
    }

    const data = await coinGeckoService.searchCryptocurrencies(query);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erreur route /search:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la recherche'
    });
  }
});

// Route pour récupérer les trending coins
router.get('/search/trending', async (req, res) => {
  try {
    const data = await coinGeckoService.getTrendingCoins();

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erreur route /search/trending:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des trending coins'
    });
  }
});

// Route pour récupérer les exchanges
router.get('/exchanges', async (req, res) => {
  try {
    const data = await coinGeckoService.getExchanges();

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Erreur route /exchanges:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des exchanges'
    });
  }
});

module.exports = router;