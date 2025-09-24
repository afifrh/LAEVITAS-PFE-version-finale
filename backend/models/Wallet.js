const mongoose = require('mongoose');

// Schéma pour les transactions de portefeuille
const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'fee', 'bonus'],
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'crypto_wallet', 'internal'],
    required: function() {
      return this.type === 'deposit' || this.type === 'withdrawal';
    }
  },
  externalReference: {
    type: String, // ID de transaction externe (banque, blockchain, etc.)
    sparse: true
  },
  fees: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  metadata: {
    bankAccount: {
      iban: String,
      bic: String,
      accountHolder: String
    },
    cryptoWallet: {
      address: String,
      network: String,
      txHash: String
    },
    notes: String
  },
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schéma pour les soldes par devise
const balanceSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  available: {
    type: Number,
    default: 0,
    min: 0
  },
  locked: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Schéma principal du portefeuille
const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balances: [balanceSchema],
  transactions: [walletTransactionSchema],
  settings: {
    defaultCurrency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    autoConvert: {
      type: Boolean,
      default: false
    },
    notifications: {
      deposits: { type: Boolean, default: true },
      withdrawals: { type: Boolean, default: true },
      lowBalance: { type: Boolean, default: true },
      threshold: { type: Number, default: 100 }
    }
  },
  verification: {
    level: {
      type: Number,
      enum: [0, 1, 2, 3], // 0: non vérifié, 1: email, 2: KYC basique, 3: KYC complet
      default: 0
    },
    limits: {
      dailyDeposit: { type: Number, default: 1000 },
      dailyWithdrawal: { type: Number, default: 500 },
      monthlyDeposit: { type: Number, default: 10000 },
      monthlyWithdrawal: { type: Number, default: 5000 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les requêtes
walletSchema.index({ userId: 1 });
walletSchema.index({ 'transactions.status': 1 });
walletSchema.index({ 'transactions.type': 1 });
walletSchema.index({ 'transactions.createdAt': -1 });

// Middleware pour calculer le total automatiquement
balanceSchema.pre('save', function() {
  this.total = this.available + this.locked;
});

// Méthodes du portefeuille
walletSchema.methods.getBalance = function(currency) {
  const balance = this.balances.find(b => b.currency === currency.toUpperCase());
  return balance || { currency: currency.toUpperCase(), available: 0, locked: 0, total: 0 };
};

walletSchema.methods.updateBalance = function(currency, available, locked) {
  const currencyUpper = currency.toUpperCase();
  let balance = this.balances.find(b => b.currency === currencyUpper);
  
  if (!balance) {
    balance = {
      currency: currencyUpper,
      available: 0,
      locked: 0,
      total: 0
    };
    this.balances.push(balance);
  }
  
  if (available !== undefined) balance.available = Math.max(0, available);
  if (locked !== undefined) balance.locked = Math.max(0, locked);
  balance.total = balance.available + balance.locked;
  
  this.updatedAt = new Date();
  return balance;
};

walletSchema.methods.addTransaction = function(transactionData) {
  const transaction = {
    ...transactionData,
    createdAt: new Date()
  };
  
  this.transactions.push(transaction);
  this.updatedAt = new Date();
  
  return transaction;
};

walletSchema.methods.canWithdraw = function(currency, amount) {
  const balance = this.getBalance(currency);
  return balance.available >= amount;
};

walletSchema.methods.lockFunds = function(currency, amount) {
  const balance = this.getBalance(currency);
  
  if (balance.available < amount) {
    throw new Error('Fonds insuffisants');
  }
  
  this.updateBalance(currency, balance.available - amount, balance.locked + amount);
  return true;
};

walletSchema.methods.unlockFunds = function(currency, amount) {
  const balance = this.getBalance(currency);
  
  if (balance.locked < amount) {
    throw new Error('Fonds verrouillés insuffisants');
  }
  
  this.updateBalance(currency, balance.available + amount, balance.locked - amount);
  return true;
};

walletSchema.methods.getTransactionHistory = function(filters = {}) {
  let transactions = [...this.transactions];
  
  if (filters.type) {
    transactions = transactions.filter(t => t.type === filters.type);
  }
  
  if (filters.currency) {
    transactions = transactions.filter(t => t.currency === filters.currency.toUpperCase());
  }
  
  if (filters.status) {
    transactions = transactions.filter(t => t.status === filters.status);
  }
  
  if (filters.startDate) {
    transactions = transactions.filter(t => t.createdAt >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    transactions = transactions.filter(t => t.createdAt <= new Date(filters.endDate));
  }
  
  // Trier par date décroissante
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return transactions;
};

// Méthodes statiques
walletSchema.statics.createWallet = async function(userId) {
  const wallet = new this({
    userId,
    balances: [
      { currency: 'USD', available: 0, locked: 0, total: 0 },
      { currency: 'EUR', available: 0, locked: 0, total: 0 },
      { currency: 'BTC', available: 0, locked: 0, total: 0 },
      { currency: 'ETH', available: 0, locked: 0, total: 0 }
    ]
  });
  
  return await wallet.save();
};

walletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Middleware pour mettre à jour updatedAt
walletSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Wallet', walletSchema);