const mongoose = require('mongoose');

// Schéma pour les actifs du portefeuille
const assetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Le symbole de l\'actif est requis'],
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Le nom de l\'actif est requis'],
    trim: true
  },
  type: {
    type: String,
    enum: ['crypto', 'stock', 'forex'],
    required: [true, 'Le type d\'actif est requis']
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [0, 'La quantité ne peut pas être négative']
  },
  averageBuyPrice: {
    type: Number,
    required: [true, 'Le prix d\'achat moyen est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: [0, 'Le prix actuel ne peut pas être négatif']
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: [0, 'Le montant investi ne peut pas être négatif']
  },
  currentValue: {
    type: Number,
    default: 0,
    min: [0, 'La valeur actuelle ne peut pas être négative']
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Schéma pour les transactions
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: [true, 'Le type de transaction est requis']
  },
  symbol: {
    type: String,
    required: [true, 'Le symbole est requis'],
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [0.000001, 'La quantité doit être positive']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Le montant total est requis'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Les frais ne peuvent pas être négatifs']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  }
});

// Schéma principal du portefeuille
const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID utilisateur est requis'],
    unique: true
  },
  assets: [assetSchema],
  transactions: [transactionSchema],
  totalValue: {
    type: Number,
    default: 0,
    min: [0, 'La valeur totale ne peut pas être négative']
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: [0, 'Le montant total investi ne peut pas être négatif']
  },
  totalProfitLoss: {
    type: Number,
    default: 0
  },
  totalProfitLossPercentage: {
    type: Number,
    default: 0
  },
  performance: {
    daily: {
      change: { type: Number, default: 0 },
      changePercentage: { type: Number, default: 0 }
    },
    weekly: {
      change: { type: Number, default: 0 },
      changePercentage: { type: Number, default: 0 }
    },
    monthly: {
      change: { type: Number, default: 0 },
      changePercentage: { type: Number, default: 0 }
    },
    yearly: {
      change: { type: Number, default: 0 },
      changePercentage: { type: Number, default: 0 }
    }
  },
  riskMetrics: {
    volatility: { type: Number, default: 0 },
    sharpeRatio: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 }
  },
  diversification: {
    cryptoPercentage: { type: Number, default: 0 },
    stockPercentage: { type: Number, default: 0 },
    forexPercentage: { type: Number, default: 0 }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ 'assets.symbol': 1 });
portfolioSchema.index({ 'transactions.timestamp': -1 });

// Virtual pour calculer le nombre total d'actifs
portfolioSchema.virtual('totalAssets').get(function() {
  return this.assets.length;
});

// Virtual pour calculer le nombre total de transactions
portfolioSchema.virtual('totalTransactions').get(function() {
  return this.transactions.length;
});

// Méthode pour ajouter un actif au portefeuille
portfolioSchema.methods.addAsset = function(assetData) {
  const existingAssetIndex = this.assets.findIndex(
    asset => asset.symbol === assetData.symbol.toUpperCase()
  );

  if (existingAssetIndex !== -1) {
    // Mettre à jour l'actif existant
    const existingAsset = this.assets[existingAssetIndex];
    const newTotalQuantity = existingAsset.quantity + assetData.quantity;
    const newTotalInvested = existingAsset.totalInvested + (assetData.quantity * assetData.price);
    
    existingAsset.quantity = newTotalQuantity;
    existingAsset.averageBuyPrice = newTotalInvested / newTotalQuantity;
    existingAsset.totalInvested = newTotalInvested;
    existingAsset.lastUpdated = new Date();
  } else {
    // Ajouter un nouvel actif
    this.assets.push({
      symbol: assetData.symbol.toUpperCase(),
      name: assetData.name,
      type: assetData.type,
      quantity: assetData.quantity,
      averageBuyPrice: assetData.price,
      currentPrice: assetData.price,
      totalInvested: assetData.quantity * assetData.price,
      currentValue: assetData.quantity * assetData.price
    });
  }

  return this.save();
};

// Méthode pour supprimer ou réduire un actif
portfolioSchema.methods.removeAsset = function(symbol, quantity) {
  const assetIndex = this.assets.findIndex(
    asset => asset.symbol === symbol.toUpperCase()
  );

  if (assetIndex === -1) {
    throw new Error('Actif non trouvé dans le portefeuille');
  }

  const asset = this.assets[assetIndex];
  
  if (quantity >= asset.quantity) {
    // Supprimer complètement l'actif
    this.assets.splice(assetIndex, 1);
  } else {
    // Réduire la quantité
    asset.quantity -= quantity;
    asset.totalInvested = asset.quantity * asset.averageBuyPrice;
    asset.currentValue = asset.quantity * asset.currentPrice;
    asset.lastUpdated = new Date();
  }

  return this.save();
};

// Méthode pour ajouter une transaction
portfolioSchema.methods.addTransaction = function(transactionData) {
  this.transactions.push({
    type: transactionData.type,
    symbol: transactionData.symbol.toUpperCase(),
    quantity: transactionData.quantity,
    price: transactionData.price,
    totalAmount: transactionData.quantity * transactionData.price,
    fees: transactionData.fees || 0,
    notes: transactionData.notes
  });

  return this.save();
};

// Méthode pour mettre à jour les prix actuels
portfolioSchema.methods.updatePrices = function(priceData) {
  this.assets.forEach(asset => {
    if (priceData[asset.symbol]) {
      asset.currentPrice = priceData[asset.symbol];
      asset.currentValue = asset.quantity * asset.currentPrice;
      asset.profitLoss = asset.currentValue - asset.totalInvested;
      asset.profitLossPercentage = asset.totalInvested > 0 
        ? ((asset.profitLoss / asset.totalInvested) * 100) 
        : 0;
      asset.lastUpdated = new Date();
    }
  });

  this.calculateTotals();
  return this.save();
};

// Méthode pour calculer les totaux du portefeuille
portfolioSchema.methods.calculateTotals = function() {
  this.totalValue = this.assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  this.totalInvested = this.assets.reduce((sum, asset) => sum + asset.totalInvested, 0);
  this.totalProfitLoss = this.totalValue - this.totalInvested;
  this.totalProfitLossPercentage = this.totalInvested > 0 
    ? ((this.totalProfitLoss / this.totalInvested) * 100) 
    : 0;

  // Calculer la diversification
  if (this.totalValue > 0) {
    this.diversification.cryptoPercentage = this.assets
      .filter(asset => asset.type === 'crypto')
      .reduce((sum, asset) => sum + asset.currentValue, 0) / this.totalValue * 100;
    
    this.diversification.stockPercentage = this.assets
      .filter(asset => asset.type === 'stock')
      .reduce((sum, asset) => sum + asset.currentValue, 0) / this.totalValue * 100;
    
    this.diversification.forexPercentage = this.assets
      .filter(asset => asset.type === 'forex')
      .reduce((sum, asset) => sum + asset.currentValue, 0) / this.totalValue * 100;
  }

  this.lastUpdated = new Date();
};

// Middleware pour calculer automatiquement les totaux avant sauvegarde
portfolioSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);