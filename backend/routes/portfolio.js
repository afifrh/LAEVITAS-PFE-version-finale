const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};

// @desc    Obtenir le portefeuille de l'utilisateur
// @route   GET /api/portfolio
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    // Créer un portefeuille vide si il n'existe pas
    if (!portfolio) {
      portfolio = new Portfolio({
        userId: req.user._id,
        assets: [],
        transactions: []
      });
      await portfolio.save();
    }

    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du portefeuille:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du portefeuille'
    });
  }
});

// @desc    Ajouter un actif au portefeuille
// @route   POST /api/portfolio/assets
// @access  Private
router.post('/assets', [
  authenticate,
  body('symbol').notEmpty().withMessage('Le symbole est requis'),
  body('name').notEmpty().withMessage('Le nom de l\'actif est requis'),
  body('type').isIn(['crypto', 'stock', 'forex']).withMessage('Type d\'actif invalide'),
  body('quantity').isFloat({ min: 0.000001 }).withMessage('La quantité doit être positive'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { symbol, name, type, quantity, price, notes } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      portfolio = new Portfolio({
        userId: req.user._id,
        assets: [],
        transactions: []
      });
    }

    // Ajouter l'actif au portefeuille
    await portfolio.addAsset({
      symbol,
      name,
      type,
      quantity,
      price
    });

    // Ajouter la transaction d'achat
    await portfolio.addTransaction({
      type: 'buy',
      symbol,
      quantity,
      price,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Actif ajouté au portefeuille avec succès',
      data: portfolio
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'actif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout de l\'actif'
    });
  }
});

// @desc    Vendre un actif du portefeuille
// @route   POST /api/portfolio/assets/sell
// @access  Private
router.post('/assets/sell', [
  authenticate,
  body('symbol').notEmpty().withMessage('Le symbole est requis'),
  body('quantity').isFloat({ min: 0.000001 }).withMessage('La quantité doit être positive'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { symbol, quantity, price, notes } = req.body;

    const portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }

    // Vérifier si l'actif existe et si la quantité est suffisante
    const asset = portfolio.assets.find(a => a.symbol === symbol.toUpperCase());
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Actif non trouvé dans le portefeuille'
      });
    }

    if (asset.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantité insuffisante pour la vente'
      });
    }

    // Supprimer ou réduire l'actif
    await portfolio.removeAsset(symbol, quantity);

    // Ajouter la transaction de vente
    await portfolio.addTransaction({
      type: 'sell',
      symbol,
      quantity,
      price,
      notes
    });

    res.json({
      success: true,
      message: 'Vente effectuée avec succès',
      data: portfolio
    });
  } catch (error) {
    console.error('Erreur lors de la vente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur lors de la vente'
    });
  }
});

// @desc    Obtenir les transactions du portefeuille
// @route   GET /api/portfolio/transactions
// @access  Private
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, symbol } = req.query;
    
    const portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      return res.json({
        success: true,
        data: {
          transactions: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalTransactions: 0
          }
        }
      });
    }

    let transactions = [...portfolio.transactions];

    // Filtrer par type si spécifié
    if (type && ['buy', 'sell'].includes(type)) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Filtrer par symbole si spécifié
    if (symbol) {
      transactions = transactions.filter(t => t.symbol === symbol.toUpperCase());
    }

    // Trier par date décroissante
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.length / limit),
          totalTransactions: transactions.length
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des transactions'
    });
  }
});

// @desc    Mettre à jour les prix des actifs
// @route   PUT /api/portfolio/prices
// @access  Private
router.put('/prices', [
  authenticate,
  body('prices').isObject().withMessage('Les prix doivent être un objet'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { prices } = req.body;

    const portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }

    await portfolio.updatePrices(prices);

    res.json({
      success: true,
      message: 'Prix mis à jour avec succès',
      data: portfolio
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des prix:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour des prix'
    });
  }
});

// @desc    Obtenir les statistiques du portefeuille
// @route   GET /api/portfolio/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      return res.json({
        success: true,
        data: {
          totalValue: 0,
          totalInvested: 0,
          totalProfitLoss: 0,
          totalProfitLossPercentage: 0,
          totalAssets: 0,
          totalTransactions: 0,
          performance: {
            daily: { change: 0, changePercentage: 0 },
            weekly: { change: 0, changePercentage: 0 },
            monthly: { change: 0, changePercentage: 0 },
            yearly: { change: 0, changePercentage: 0 }
          },
          diversification: {
            cryptoPercentage: 0,
            stockPercentage: 0,
            forexPercentage: 0
          },
          topAssets: []
        }
      });
    }

    // Calculer les top 5 actifs par valeur
    const topAssets = portfolio.assets
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5)
      .map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        value: asset.currentValue,
        percentage: portfolio.totalValue > 0 ? (asset.currentValue / portfolio.totalValue * 100) : 0,
        profitLoss: asset.profitLoss,
        profitLossPercentage: asset.profitLossPercentage
      }));

    res.json({
      success: true,
      data: {
        totalValue: portfolio.totalValue,
        totalInvested: portfolio.totalInvested,
        totalProfitLoss: portfolio.totalProfitLoss,
        totalProfitLossPercentage: portfolio.totalProfitLossPercentage,
        totalAssets: portfolio.totalAssets,
        totalTransactions: portfolio.totalTransactions,
        performance: portfolio.performance,
        diversification: portfolio.diversification,
        riskMetrics: portfolio.riskMetrics,
        topAssets,
        lastUpdated: portfolio.lastUpdated
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// @desc    Supprimer complètement un actif du portefeuille
// @route   DELETE /api/portfolio/assets/:symbol
// @access  Private
router.delete('/assets/:symbol', authenticate, async (req, res) => {
  try {
    const { symbol } = req.params;

    const portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }

    const assetIndex = portfolio.assets.findIndex(
      asset => asset.symbol === symbol.toUpperCase()
    );

    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Actif non trouvé dans le portefeuille'
      });
    }

    // Supprimer l'actif
    portfolio.assets.splice(assetIndex, 1);
    await portfolio.save();

    res.json({
      success: true,
      message: 'Actif supprimé du portefeuille avec succès',
      data: portfolio
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'actif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'actif'
    });
  }
});

module.exports = router;