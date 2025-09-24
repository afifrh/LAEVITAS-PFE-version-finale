const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting pour les opérations sensibles
const walletRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requêtes par fenêtre
  message: 'Trop de tentatives, veuillez réessayer plus tard'
});

// Middleware de validation
const validateAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Montant invalide'
    });
  }
  
  if (amount > 1000000) {
    return res.status(400).json({
      success: false,
      message: 'Montant trop élevé'
    });
  }
  
  next();
};

const validateCurrency = (req, res, next) => {
  const { currency } = req.body;
  const supportedCurrencies = ['USD', 'EUR', 'BTC', 'ETH', 'USDT', 'BNB'];
  
  if (!currency || !supportedCurrencies.includes(currency.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Devise non supportée'
    });
  }
  
  next();
};

// GET /api/wallet - Obtenir le portefeuille de l'utilisateur
router.get('/', authenticate, async (req, res) => {
  try {
    let wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      wallet = await Wallet.createWallet(req.user.id);
    }
    
    res.json({
      success: true,
      data: {
        balances: wallet.balances,
        settings: wallet.settings,
        verification: wallet.verification,
        totalValue: calculateTotalValue(wallet.balances), // À implémenter avec les prix en temps réel
        updatedAt: wallet.updatedAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du portefeuille:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/wallet/balance/:currency - Obtenir le solde d'une devise spécifique
router.get('/balance/:currency', authenticate, async (req, res) => {
  try {
    const wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }
    
    const balance = wallet.getBalance(req.params.currency);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/wallet/deposit - Initier un dépôt
router.post('/deposit', authenticate, walletRateLimit, validateAmount, validateCurrency, async (req, res) => {
  try {
    const { amount, currency, method, metadata } = req.body;
    
    let wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      wallet = await Wallet.createWallet(req.user.id);
    }
    
    // Vérifier les limites de dépôt
    const dailyDeposits = wallet.getTransactionHistory({
      type: 'deposit',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });
    
    const dailyTotal = dailyDeposits
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (dailyTotal + amount > wallet.verification.limits.dailyDeposit) {
      return res.status(400).json({
        success: false,
        message: 'Limite de dépôt quotidienne dépassée'
      });
    }
    
    // Créer la transaction de dépôt
    const transaction = wallet.addTransaction({
      type: 'deposit',
      currency: currency.toUpperCase(),
      amount: parseFloat(amount),
      method,
      status: 'pending',
      metadata: metadata || {},
      externalReference: generateTransactionId()
    });
    
    await wallet.save();
    
    // Simuler le traitement du dépôt (en production, intégrer avec les APIs de paiement)
    setTimeout(async () => {
      await processDeposit(wallet._id, transaction._id);
    }, 5000);
    
    res.json({
      success: true,
      message: 'Dépôt initié avec succès',
      data: {
        transactionId: transaction._id,
        externalReference: transaction.externalReference,
        status: transaction.status,
        estimatedProcessingTime: '5-10 minutes'
      }
    });
  } catch (error) {
    console.error('Erreur lors du dépôt:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du dépôt'
    });
  }
});

// POST /api/wallet/withdraw - Initier un retrait
router.post('/withdraw', authenticate, walletRateLimit, validateAmount, validateCurrency, async (req, res) => {
  try {
    const { amount, currency, method, metadata } = req.body;
    
    const wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }
    
    // Vérifier les fonds disponibles
    if (!wallet.canWithdraw(currency, amount)) {
      return res.status(400).json({
        success: false,
        message: 'Fonds insuffisants'
      });
    }
    
    // Vérifier les limites de retrait
    const dailyWithdrawals = wallet.getTransactionHistory({
      type: 'withdrawal',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });
    
    const dailyTotal = dailyWithdrawals
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (dailyTotal + amount > wallet.verification.limits.dailyWithdrawal) {
      return res.status(400).json({
        success: false,
        message: 'Limite de retrait quotidienne dépassée'
      });
    }
    
    // Calculer les frais
    const fees = calculateWithdrawalFees(amount, currency, method);
    
    // Verrouiller les fonds
    wallet.lockFunds(currency, amount + fees.amount);
    
    // Créer la transaction de retrait
    const transaction = wallet.addTransaction({
      type: 'withdrawal',
      currency: currency.toUpperCase(),
      amount: parseFloat(amount),
      method,
      status: 'processing',
      fees,
      metadata: metadata || {},
      externalReference: generateTransactionId()
    });
    
    await wallet.save();
    
    // Simuler le traitement du retrait
    setTimeout(async () => {
      await processWithdrawal(wallet._id, transaction._id);
    }, 10000);
    
    res.json({
      success: true,
      message: 'Retrait initié avec succès',
      data: {
        transactionId: transaction._id,
        externalReference: transaction.externalReference,
        status: transaction.status,
        fees,
        estimatedProcessingTime: '1-3 jours ouvrables'
      }
    });
  } catch (error) {
    console.error('Erreur lors du retrait:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du traitement du retrait'
    });
  }
});

// GET /api/wallet/transactions - Obtenir l'historique des transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { type, currency, status, page = 1, limit = 20, startDate, endDate } = req.query;
    
    const wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }
    
    const filters = {};
    if (type) filters.type = type;
    if (currency) filters.currency = currency;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const transactions = wallet.getTransactionHistory(filters);
    
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
          totalTransactions: transactions.length,
          hasNext: endIndex < transactions.length,
          hasPrev: startIndex > 0
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/wallet/transaction/:id - Obtenir une transaction spécifique
router.get('/transaction/:id', authenticate, async (req, res) => {
  try {
    const wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }
    
    const transaction = wallet.transactions.id(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/wallet/settings - Mettre à jour les paramètres du portefeuille
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { defaultCurrency, autoConvert, notifications } = req.body;
    
    const wallet = await Wallet.findByUserId(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Portefeuille non trouvé'
      });
    }
    
    if (defaultCurrency) wallet.settings.defaultCurrency = defaultCurrency.toUpperCase();
    if (autoConvert !== undefined) wallet.settings.autoConvert = autoConvert;
    if (notifications) {
      wallet.settings.notifications = { ...wallet.settings.notifications, ...notifications };
    }
    
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: wallet.settings
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Fonctions utilitaires
function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function calculateWithdrawalFees(amount, currency, method) {
  const feeRates = {
    bank_transfer: { fixed: 5, percentage: 0.001 },
    credit_card: { fixed: 2, percentage: 0.025 },
    crypto_wallet: { fixed: 0, percentage: 0.005 }
  };
  
  const rate = feeRates[method] || feeRates.bank_transfer;
  const fee = rate.fixed + (amount * rate.percentage);
  
  return {
    amount: parseFloat(fee.toFixed(8)),
    currency: currency === 'BTC' || currency === 'ETH' ? currency : 'USD'
  };
}

function calculateTotalValue(balances) {
  // En production, utiliser les prix en temps réel
  const mockPrices = {
    USD: 1,
    EUR: 0.85,
    BTC: 45000,
    ETH: 3000,
    USDT: 1,
    BNB: 300
  };
  
  return balances.reduce((total, balance) => {
    const price = mockPrices[balance.currency] || 1;
    return total + (balance.total * price);
  }, 0);
}

async function processDeposit(walletId, transactionId) {
  try {
    const wallet = await Wallet.findById(walletId);
    const transaction = wallet.transactions.id(transactionId);
    
    if (transaction && transaction.status === 'pending') {
      // Simuler la confirmation du dépôt
      transaction.status = 'completed';
      transaction.processedAt = new Date();
      
      // Ajouter les fonds au solde
      wallet.updateBalance(
        transaction.currency,
        wallet.getBalance(transaction.currency).available + transaction.amount,
        wallet.getBalance(transaction.currency).locked
      );
      
      await wallet.save();
      
      console.log(`Dépôt traité: ${transaction.amount} ${transaction.currency}`);
    }
  } catch (error) {
    console.error('Erreur lors du traitement du dépôt:', error);
  }
}

async function processWithdrawal(walletId, transactionId) {
  try {
    const wallet = await Wallet.findById(walletId);
    const transaction = wallet.transactions.id(transactionId);
    
    if (transaction && transaction.status === 'processing') {
      // Simuler le traitement du retrait
      transaction.status = 'completed';
      transaction.processedAt = new Date();
      
      // Débloquer et retirer les fonds
      const totalAmount = transaction.amount + transaction.fees.amount;
      const balance = wallet.getBalance(transaction.currency);
      
      wallet.updateBalance(
        transaction.currency,
        balance.available,
        balance.locked - totalAmount
      );
      
      await wallet.save();
      
      console.log(`Retrait traité: ${transaction.amount} ${transaction.currency}`);
    }
  } catch (error) {
    console.error('Erreur lors du traitement du retrait:', error);
  }
}

module.exports = router;