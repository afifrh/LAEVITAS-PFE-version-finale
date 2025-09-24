const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Market = require('../models/Market');
const Watchlist = require('../models/Watchlist');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting pour les endpoints publics
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
});

const marketDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requêtes par minute pour les données de marché
  message: { error: 'Limite de requêtes atteinte pour les données de marché' }
});

// ==================== ROUTES PUBLIQUES ====================

// GET /api/markets - Obtenir la liste des marchés
router.get('/', publicLimiter, [
  query('type')
    .optional()
    .isIn(['crypto', 'forex', 'stock', 'commodity'])
    .withMessage('Type de marché invalide'),
  query('category')
    .optional()
    .isIn(['major', 'minor', 'exotic', 'popular'])
    .withMessage('Catégorie invalide'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Terme de recherche invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide'),
  query('sort')
    .optional()
    .isIn(['volume', 'change', 'alphabetical', 'marketcap'])
    .withMessage('Tri invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const { type, category, search, limit = 50, sort = 'volume' } = req.query;
    
    let markets;
    
    if (search) {
      markets = await Market.searchMarkets(search, parseInt(limit));
    } else {
      const query = { status: 'active' };
      if (type) query.type = type;
      if (category) query.category = category;
      
      let sortOption = { 'marketData.volume24h': -1 };
      switch (sort) {
        case 'change':
          sortOption = { 'marketData.changePercent24h': -1 };
          break;
        case 'alphabetical':
          sortOption = { symbol: 1 };
          break;
        case 'marketcap':
          sortOption = { 'stats.marketCap': -1 };
          break;
      }
      
      markets = await Market.find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .lean();
    }

    // Formater les données pour la réponse
    const formattedMarkets = markets.map(market => ({
      symbol: market.symbol,
      baseAsset: market.baseAsset,
      quoteAsset: market.quoteAsset,
      type: market.type,
      category: market.category,
      name: market.name,
      marketData: market.marketData,
      metadata: {
        icon: market.metadata?.icon,
        precision: market.metadata?.precision
      },
      tradingConfig: {
        minOrderSize: market.tradingConfig?.minOrderSize,
        maxOrderSize: market.tradingConfig?.maxOrderSize,
        fees: market.tradingConfig?.fees
      }
    }));

    res.json({
      success: true,
      data: {
        markets: formattedMarkets,
        total: formattedMarkets.length,
        filters: { type, category, search, sort }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des marchés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/markets/popular - Obtenir les marchés populaires
router.get('/popular', publicLimiter, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite invalide')
], async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const markets = await Market.findPopularMarkets(parseInt(limit));
    
    res.json({
      success: true,
      data: markets.map(market => market.getPublicData ? market.getPublicData() : market)
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des marchés populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/markets/types - Obtenir les types de marchés disponibles
router.get('/types', publicLimiter, async (req, res) => {
  try {
    const types = await Market.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: types.map(type => ({
        type: type._id,
        count: type.count
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des types:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/markets/:symbol - Obtenir les détails d'un marché
router.get('/:symbol', marketDataLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const market = await Market.findOne({ 
      symbol: symbol.toUpperCase(),
      status: 'active'
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: 'Marché non trouvé'
      });
    }

    res.json({
      success: true,
      data: market.getPublicData()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du marché:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/markets/:symbol/ticker - Obtenir le ticker d'un marché
router.get('/:symbol/ticker', marketDataLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const market = await Market.findOne({ 
      symbol: symbol.toUpperCase(),
      status: 'active'
    }).select('symbol marketData');

    if (!market) {
      return res.status(404).json({
        success: false,
        message: 'Marché non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        symbol: market.symbol,
        ...market.marketData.toObject()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du ticker:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ==================== ROUTES PROTÉGÉES ====================

// GET /api/markets/watchlist - Obtenir les watchlists de l'utilisateur
router.get('/user/watchlists', authenticate, async (req, res) => {
  try {
    const watchlists = await Watchlist.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: watchlists
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des watchlists:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/markets/watchlist - Créer une nouvelle watchlist
router.post('/user/watchlists', authenticate, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom requis (1-100 caractères)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description trop longue (max 500 caractères)'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { name, description, isDefault = false } = req.body;

    const watchlist = new Watchlist({
      userId: req.user.id,
      name,
      description,
      isDefault
    });

    await watchlist.save();

    res.status(201).json({
      success: true,
      data: watchlist
    });

  } catch (error) {
    console.error('Erreur lors de la création de la watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/markets/watchlist/:id - Obtenir une watchlist spécifique
router.get('/user/watchlists/:id', authenticate, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist non trouvée'
      });
    }

    // Enrichir avec les données de marché actuelles
    const symbols = watchlist.items.map(item => item.symbol);
    const markets = await Market.find({ 
      symbol: { $in: symbols },
      status: 'active'
    }).lean();

    const enrichedItems = watchlist.items.map(item => {
      const marketData = markets.find(m => m.symbol === item.symbol);
      return {
        ...item.toObject(),
        marketData: marketData?.marketData || null
      };
    });

    res.json({
      success: true,
      data: {
        ...watchlist.toObject(),
        items: enrichedItems
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/markets/watchlist/:id - Mettre à jour une watchlist
router.put('/user/watchlists/:id', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom invalide (1-100 caractères)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description trop longue (max 500 caractères)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist non trouvée'
      });
    }

    const { name, description, settings } = req.body;
    
    if (name) watchlist.name = name;
    if (description !== undefined) watchlist.description = description;
    if (settings) Object.assign(watchlist.settings, settings);

    await watchlist.save();

    res.json({
      success: true,
      data: watchlist
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/markets/watchlist/:id - Supprimer une watchlist
router.delete('/user/watchlists/:id', authenticate, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Watchlist supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/markets/watchlist/:id/items - Ajouter un instrument à la watchlist
router.post('/user/watchlists/:id/items', authenticate, [
  body('symbol')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Symbol requis'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes trop longues'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags doit être un tableau')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist non trouvée'
      });
    }

    const { symbol, notes, tags, priority, color } = req.body;

    // Vérifier que le marché existe
    const market = await Market.findOne({ 
      symbol: symbol.toUpperCase(),
      status: 'active'
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: 'Marché non trouvé'
      });
    }

    await watchlist.addItem(symbol, { notes, tags, priority, color });

    res.status(201).json({
      success: true,
      message: 'Instrument ajouté à la watchlist',
      data: watchlist
    });

  } catch (error) {
    if (error.message.includes('déjà dans') || error.message.includes('Limite')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Erreur lors de l\'ajout à la watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/markets/watchlist/:id/items/:symbol - Supprimer un instrument
router.delete('/user/watchlists/:id/items/:symbol', authenticate, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist non trouvée'
      });
    }

    await watchlist.removeItem(req.params.symbol);

    res.json({
      success: true,
      message: 'Instrument supprimé de la watchlist'
    });

  } catch (error) {
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/markets/watchlist/:id/items/:symbol/alerts - Ajouter une alerte
router.post('/user/watchlists/:id/items/:symbol/alerts', authenticate, [
  body('type')
    .isIn(['price_above', 'price_below', 'volume_spike', 'change_percent'])
    .withMessage('Type d\'alerte invalide'),
  body('value')
    .isNumeric()
    .withMessage('Valeur requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist non trouvée'
      });
    }

    const { type, value } = req.body;
    
    await watchlist.addAlert(req.params.symbol, { type, value });

    res.status(201).json({
      success: true,
      message: 'Alerte ajoutée avec succès'
    });

  } catch (error) {
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Erreur lors de l\'ajout de l\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;