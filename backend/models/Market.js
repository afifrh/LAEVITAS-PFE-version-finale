const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  baseAsset: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  quoteAsset: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['crypto', 'forex', 'stock', 'commodity'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['major', 'minor', 'exotic', 'popular', 'altcoin'],
    default: 'minor'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'delisted'],
    default: 'active',
    index: true
  },
  // Informations de base
  name: {
    type: String,
    required: true
  },
  description: String,
  // Configuration de trading
  tradingConfig: {
    minOrderSize: {
      type: Number,
      required: true,
      min: 0
    },
    maxOrderSize: {
      type: Number,
      required: true,
      min: 0
    },
    tickSize: {
      type: Number,
      required: true,
      min: 0
    },
    lotSize: {
      type: Number,
      required: true,
      min: 0
    },
    // Frais de trading
    fees: {
      maker: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      taker: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      }
    },
    // Heures de trading
    tradingHours: {
      timezone: {
        type: String,
        default: 'UTC'
      },
      sessions: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        open: String, // Format HH:MM
        close: String // Format HH:MM
      }]
    }
  },
  // Données de marché actuelles
  marketData: {
    lastPrice: {
      type: Number,
      default: 0
    },
    bid: {
      type: Number,
      default: 0
    },
    ask: {
      type: Number,
      default: 0
    },
    volume24h: {
      type: Number,
      default: 0
    },
    change24h: {
      type: Number,
      default: 0
    },
    changePercent24h: {
      type: Number,
      default: 0
    },
    high24h: {
      type: Number,
      default: 0
    },
    low24h: {
      type: Number,
      default: 0
    },
    open24h: {
      type: Number,
      default: 0
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    }
  },
  // Métadonnées
  metadata: {
    icon: String,
    website: String,
    whitepaper: String,
    explorer: String,
    source: String, // Source des données (binance, coinbase, etc.)
    precision: {
      price: {
        type: Number,
        default: 8
      },
      quantity: {
        type: Number,
        default: 8
      }
    }
  },
  // Statistiques
  stats: {
    totalTrades: {
      type: Number,
      default: 0
    },
    totalVolume: {
      type: Number,
      default: 0
    },
    avgDailyVolume: {
      type: Number,
      default: 0
    },
    marketCap: Number,
    circulatingSupply: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composés pour les requêtes fréquentes
marketSchema.index({ type: 1, status: 1 });
marketSchema.index({ category: 1, status: 1 });
marketSchema.index({ 'marketData.volume24h': -1 });
marketSchema.index({ 'marketData.changePercent24h': -1 });

// Virtuals
marketSchema.virtual('spread').get(function() {
  if (this.marketData.ask && this.marketData.bid) {
    return this.marketData.ask - this.marketData.bid;
  }
  return 0;
});

marketSchema.virtual('spreadPercent').get(function() {
  if (this.marketData.ask && this.marketData.bid && this.marketData.bid > 0) {
    return ((this.marketData.ask - this.marketData.bid) / this.marketData.bid) * 100;
  }
  return 0;
});

marketSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Méthodes statiques
marketSchema.statics.findActiveMarkets = function(type = null) {
  const query = { status: 'active' };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ 'marketData.volume24h': -1 })
    .lean();
};

marketSchema.statics.findPopularMarkets = function(limit = 20) {
  return this.find({ 
    status: 'active',
    category: { $in: ['major', 'popular'] }
  })
    .sort({ 'marketData.volume24h': -1 })
    .limit(limit)
    .lean();
};

marketSchema.statics.searchMarkets = function(query, limit = 50) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    status: 'active',
    $or: [
      { symbol: searchRegex },
      { name: searchRegex },
      { baseAsset: searchRegex },
      { quoteAsset: searchRegex }
    ]
  })
    .sort({ 'marketData.volume24h': -1 })
    .limit(limit)
    .lean();
};

marketSchema.statics.getMarketsByType = function(type) {
  return this.find({ 
    type: type,
    status: 'active' 
  })
    .sort({ 'marketData.volume24h': -1 })
    .lean();
};

// Méthodes d'instance
marketSchema.methods.updateMarketData = function(data) {
  const allowedFields = [
    'lastPrice', 'bid', 'ask', 'volume24h', 'change24h', 
    'changePercent24h', 'high24h', 'low24h', 'open24h'
  ];
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      this.marketData[field] = data[field];
    }
  });
  
  this.marketData.lastUpdate = new Date();
  return this.save();
};

marketSchema.methods.isWithinTradingHours = function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3); // mon, tue, etc.
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM
  
  const todaySession = this.tradingConfig.tradingHours.sessions.find(
    session => session.day.substring(0, 3) === currentDay
  );
  
  if (!todaySession) return false;
  
  return currentTime >= todaySession.open && currentTime <= todaySession.close;
};

marketSchema.methods.calculateFee = function(orderValue, orderType = 'taker') {
  const feeRate = this.tradingConfig.fees[orderType] || this.tradingConfig.fees.taker;
  return orderValue * feeRate;
};

marketSchema.methods.validateOrderSize = function(size) {
  const { minOrderSize, maxOrderSize, lotSize } = this.tradingConfig;
  
  if (size < minOrderSize) {
    return { valid: false, error: `Taille minimale: ${minOrderSize}` };
  }
  
  if (size > maxOrderSize) {
    return { valid: false, error: `Taille maximale: ${maxOrderSize}` };
  }
  
  if (size % lotSize !== 0) {
    return { valid: false, error: `Taille doit être un multiple de ${lotSize}` };
  }
  
  return { valid: true };
};

marketSchema.methods.formatPrice = function(price) {
  return parseFloat(price.toFixed(this.metadata.precision.price));
};

marketSchema.methods.formatQuantity = function(quantity) {
  return parseFloat(quantity.toFixed(this.metadata.precision.quantity));
};

marketSchema.methods.getPublicData = function() {
  return {
    symbol: this.symbol,
    baseAsset: this.baseAsset,
    quoteAsset: this.quoteAsset,
    type: this.type,
    category: this.category,
    name: this.name,
    description: this.description,
    tradingConfig: {
      minOrderSize: this.tradingConfig.minOrderSize,
      maxOrderSize: this.tradingConfig.maxOrderSize,
      tickSize: this.tradingConfig.tickSize,
      lotSize: this.tradingConfig.lotSize,
      fees: this.tradingConfig.fees
    },
    marketData: this.marketData,
    metadata: {
      icon: this.metadata.icon,
      precision: this.metadata.precision
    },
    spread: this.spread,
    spreadPercent: this.spreadPercent,
    isActive: this.isActive
  };
};

// Middleware pre-save
marketSchema.pre('save', function(next) {
  // Calculer le changement en pourcentage si pas fourni
  if (this.marketData.open24h && this.marketData.lastPrice && !this.marketData.changePercent24h) {
    this.marketData.change24h = this.marketData.lastPrice - this.marketData.open24h;
    this.marketData.changePercent24h = (this.marketData.change24h / this.marketData.open24h) * 100;
  }
  
  // Valider la configuration de trading
  if (this.tradingConfig.minOrderSize >= this.tradingConfig.maxOrderSize) {
    return next(new Error('La taille minimale doit être inférieure à la taille maximale'));
  }
  
  next();
});

const Market = mongoose.model('Market', marketSchema);

module.exports = Market;