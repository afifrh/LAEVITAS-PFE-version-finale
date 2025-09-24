const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  alerts: [{
    type: {
      type: String,
      enum: ['price_above', 'price_below', 'volume_spike', 'change_percent'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    triggeredAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  // Paramètres d'affichage personnalisés
  displaySettings: {
    showInDashboard: {
      type: Boolean,
      default: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    color: {
      type: String,
      default: '#3B82F6'
    }
  }
});

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'Ma Watchlist'
  },
  description: {
    type: String,
    maxlength: 500
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  items: [watchlistItemSchema],
  settings: {
    maxItems: {
      type: Number,
      default: 100,
      max: 500
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 5000, // 5 secondes
      min: 1000,
      max: 60000
    },
    notifications: {
      email: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: false
      }
    },
    displayColumns: [{
      type: String,
      enum: [
        'symbol', 'price', 'change', 'changePercent', 'volume', 
        'marketCap', 'high24h', 'low24h', 'alerts'
      ]
    }]
  },
  // Statistiques
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    totalAlerts: {
      type: Number,
      default: 0
    },
    triggeredAlerts: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composés
watchlistSchema.index({ userId: 1, isDefault: 1 });
watchlistSchema.index({ userId: 1, name: 1 });
watchlistSchema.index({ 'items.symbol': 1 });
watchlistSchema.index({ isPublic: 1, createdAt: -1 });

// Virtuals
watchlistSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

watchlistSchema.virtual('activeAlerts').get(function() {
  return this.items.reduce((total, item) => {
    return total + item.alerts.filter(alert => alert.isActive).length;
  }, 0);
});

watchlistSchema.virtual('highPriorityItems').get(function() {
  return this.items.filter(item => item.displaySettings.priority === 'high');
});

// Méthodes statiques
watchlistSchema.statics.findByUserId = function(userId) {
  return this.find({ userId })
    .sort({ isDefault: -1, updatedAt: -1 })
    .lean();
};

watchlistSchema.statics.findDefaultWatchlist = function(userId) {
  return this.findOne({ userId, isDefault: true });
};

watchlistSchema.statics.findPublicWatchlists = function(limit = 20) {
  return this.find({ isPublic: true })
    .populate('userId', 'firstName lastName')
    .sort({ 'stats.totalViews': -1, updatedAt: -1 })
    .limit(limit)
    .lean();
};

watchlistSchema.statics.searchWatchlists = function(userId, query) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    userId,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { 'items.symbol': searchRegex },
      { 'items.tags': searchRegex }
    ]
  })
    .sort({ updatedAt: -1 })
    .lean();
};

// Méthodes d'instance
watchlistSchema.methods.addItem = function(symbol, options = {}) {
  // Vérifier si l'item existe déjà
  const existingItem = this.items.find(item => item.symbol === symbol.toUpperCase());
  if (existingItem) {
    throw new Error('Cet instrument est déjà dans votre watchlist');
  }
  
  // Vérifier la limite
  if (this.items.length >= this.settings.maxItems) {
    throw new Error(`Limite de ${this.settings.maxItems} instruments atteinte`);
  }
  
  const newItem = {
    symbol: symbol.toUpperCase(),
    notes: options.notes || '',
    tags: options.tags || [],
    displaySettings: {
      showInDashboard: options.showInDashboard !== false,
      priority: options.priority || 'medium',
      color: options.color || '#3B82F6'
    }
  };
  
  this.items.push(newItem);
  return this.save();
};

watchlistSchema.methods.removeItem = function(symbol) {
  const itemIndex = this.items.findIndex(item => item.symbol === symbol.toUpperCase());
  if (itemIndex === -1) {
    throw new Error('Instrument non trouvé dans la watchlist');
  }
  
  this.items.splice(itemIndex, 1);
  return this.save();
};

watchlistSchema.methods.updateItem = function(symbol, updates) {
  const item = this.items.find(item => item.symbol === symbol.toUpperCase());
  if (!item) {
    throw new Error('Instrument non trouvé dans la watchlist');
  }
  
  // Mettre à jour les champs autorisés
  const allowedFields = ['notes', 'tags', 'displaySettings'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      if (field === 'displaySettings') {
        Object.assign(item.displaySettings, updates[field]);
      } else {
        item[field] = updates[field];
      }
    }
  });
  
  return this.save();
};

watchlistSchema.methods.addAlert = function(symbol, alertConfig) {
  const item = this.items.find(item => item.symbol === symbol.toUpperCase());
  if (!item) {
    throw new Error('Instrument non trouvé dans la watchlist');
  }
  
  const newAlert = {
    type: alertConfig.type,
    value: alertConfig.value,
    isActive: true
  };
  
  item.alerts.push(newAlert);
  this.stats.totalAlerts += 1;
  
  return this.save();
};

watchlistSchema.methods.removeAlert = function(symbol, alertId) {
  const item = this.items.find(item => item.symbol === symbol.toUpperCase());
  if (!item) {
    throw new Error('Instrument non trouvé dans la watchlist');
  }
  
  const alertIndex = item.alerts.findIndex(alert => alert._id.toString() === alertId);
  if (alertIndex === -1) {
    throw new Error('Alerte non trouvée');
  }
  
  item.alerts.splice(alertIndex, 1);
  this.stats.totalAlerts = Math.max(0, this.stats.totalAlerts - 1);
  
  return this.save();
};

watchlistSchema.methods.toggleAlert = function(symbol, alertId) {
  const item = this.items.find(item => item.symbol === symbol.toUpperCase());
  if (!item) {
    throw new Error('Instrument non trouvé dans la watchlist');
  }
  
  const alert = item.alerts.id(alertId);
  if (!alert) {
    throw new Error('Alerte non trouvée');
  }
  
  alert.isActive = !alert.isActive;
  return this.save();
};

watchlistSchema.methods.checkAlerts = function(marketData) {
  const triggeredAlerts = [];
  
  this.items.forEach(item => {
    const symbolData = marketData[item.symbol];
    if (!symbolData) return;
    
    item.alerts.forEach(alert => {
      if (!alert.isActive || alert.triggeredAt) return;
      
      let triggered = false;
      
      switch (alert.type) {
        case 'price_above':
          triggered = symbolData.lastPrice >= alert.value;
          break;
        case 'price_below':
          triggered = symbolData.lastPrice <= alert.value;
          break;
        case 'volume_spike':
          triggered = symbolData.volume24h >= alert.value;
          break;
        case 'change_percent':
          triggered = Math.abs(symbolData.changePercent24h) >= alert.value;
          break;
      }
      
      if (triggered) {
        alert.triggeredAt = new Date();
        alert.isActive = false;
        this.stats.triggeredAlerts += 1;
        
        triggeredAlerts.push({
          symbol: item.symbol,
          alert: alert,
          currentValue: symbolData.lastPrice,
          marketData: symbolData
        });
      }
    });
  });
  
  if (triggeredAlerts.length > 0) {
    this.save();
  }
  
  return triggeredAlerts;
};

watchlistSchema.methods.reorderItems = function(newOrder) {
  if (newOrder.length !== this.items.length) {
    throw new Error('L\'ordre doit contenir tous les éléments');
  }
  
  const reorderedItems = newOrder.map(symbol => {
    const item = this.items.find(item => item.symbol === symbol.toUpperCase());
    if (!item) {
      throw new Error(`Instrument ${symbol} non trouvé`);
    }
    return item;
  });
  
  this.items = reorderedItems;
  return this.save();
};

watchlistSchema.methods.getItemsByPriority = function(priority) {
  return this.items.filter(item => item.displaySettings.priority === priority);
};

watchlistSchema.methods.getItemsWithActiveAlerts = function() {
  return this.items.filter(item => 
    item.alerts.some(alert => alert.isActive)
  );
};

watchlistSchema.methods.incrementViews = function() {
  this.stats.totalViews += 1;
  this.stats.lastViewed = new Date();
  return this.save();
};

watchlistSchema.methods.getPublicData = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    itemCount: this.itemCount,
    activeAlerts: this.activeAlerts,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Middleware pre-save
watchlistSchema.pre('save', function(next) {
  // Assurer qu'il n'y a qu'une seule watchlist par défaut par utilisateur
  if (this.isDefault && this.isModified('isDefault')) {
    this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  
  // Valider les colonnes d'affichage
  if (this.settings.displayColumns.length === 0) {
    this.settings.displayColumns = ['symbol', 'price', 'change', 'changePercent', 'volume'];
  }
  
  next();
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;