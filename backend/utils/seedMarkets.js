const mongoose = require('mongoose');
const Market = require('../models/Market');
require('dotenv').config();

const sampleMarkets = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    type: 'crypto',
    category: 'major',
    name: 'Bitcoin',
    status: 'active',
    tradingConfig: {
      minOrderSize: 0.00001,
      maxOrderSize: 1000,
      tickSize: 0.01,
      lotSize: 0.00001,
      fees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    marketData: {
      lastPrice: 43250.50,
      volume24h: 28500000000,
      changePercent24h: 2.45,
      high24h: 44100.00,
      low24h: 42800.00,
      open24h: 42950.00,
      lastUpdate: new Date()
    },
    metadata: {
      icon: 'https://cryptoicons.org/api/icon/btc/200',
      precision: {
        price: 2,
        quantity: 8
      }
    },
    stats: {
      marketCap: 850000000000,
      circulatingSupply: 19500000
    }
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    type: 'crypto',
    category: 'major',
    name: 'Ethereum',
    status: 'active',
    marketData: {
      lastPrice: 2650.75,
      volume24h: 15200000000,
      changePercent24h: -1.25,
      high24h: 2720.00,
      low24h: 2620.00,
      openPrice: 2685.00,
      closePrice: 2650.75,
      lastUpdate: new Date()
    },
    metadata: {
      icon: 'https://cryptoicons.org/api/icon/eth/200',
      precision: 8,
      minTradeAmount: 0.001,
      maxTradeAmount: 100,
      tradingFees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    stats: {
      marketCap: 320000000000,
      circulatingSupply: 120000000,
      totalSupply: 120000000,
      allTimeHigh: 4800.00,
      allTimeLow: 80.00
    }
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    type: 'crypto',
    category: 'altcoin',
    name: 'Cardano',
    status: 'active',
    marketData: {
      lastPrice: 0.485,
      volume24h: 850000000,
      changePercent24h: 3.75,
      high24h: 0.495,
      low24h: 0.465,
      openPrice: 0.467,
      closePrice: 0.485,
      lastUpdate: new Date()
    },
    metadata: {
      icon: 'https://cryptoicons.org/api/icon/ada/200',
      precision: 6,
      minTradeAmount: 1,
      maxTradeAmount: 100000,
      tradingFees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    stats: {
      marketCap: 17000000000,
      circulatingSupply: 35000000000,
      totalSupply: 45000000000,
      allTimeHigh: 3.10,
      allTimeLow: 0.017
    }
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    type: 'crypto',
    category: 'altcoin',
    name: 'Solana',
    status: 'active',
    marketData: {
      lastPrice: 98.45,
      volume24h: 2100000000,
      changePercent24h: 5.20,
      high24h: 102.50,
      low24h: 93.20,
      openPrice: 93.60,
      closePrice: 98.45,
      lastUpdate: new Date()
    },
    metadata: {
      icon: 'https://cryptoicons.org/api/icon/sol/200',
      precision: 6,
      minTradeAmount: 0.01,
      maxTradeAmount: 1000,
      tradingFees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    stats: {
      marketCap: 42000000000,
      circulatingSupply: 426000000,
      totalSupply: 580000000,
      allTimeHigh: 260.00,
      allTimeLow: 0.50
    }
  },
  {
    symbol: 'DOTUSDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    type: 'crypto',
    category: 'altcoin',
    name: 'Polkadot',
    status: 'active',
    marketData: {
      lastPrice: 7.25,
      volume24h: 420000000,
      changePercent24h: -0.85,
      high24h: 7.45,
      low24h: 7.10,
      openPrice: 7.31,
      closePrice: 7.25,
      lastUpdate: new Date()
    },
    metadata: {
      icon: 'https://cryptoicons.org/api/icon/dot/200',
      precision: 6,
      minTradeAmount: 0.1,
      maxTradeAmount: 10000,
      tradingFees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    stats: {
      marketCap: 9500000000,
      circulatingSupply: 1310000000,
      totalSupply: 1310000000,
      allTimeHigh: 55.00,
      allTimeLow: 2.70
    }
  },
  {
    symbol: 'LINKUSDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    type: 'crypto',
    category: 'defi',
    name: 'Chainlink',
    status: 'active',
    marketData: {
      lastPrice: 14.85,
      volume24h: 680000000,
      changePercent24h: 1.95,
      high24h: 15.20,
      low24h: 14.50,
      openPrice: 14.57,
      closePrice: 14.85,
      lastUpdate: new Date()
    },
    metadata: {
      icon: 'https://cryptoicons.org/api/icon/link/200',
      precision: 6,
      minTradeAmount: 0.1,
      maxTradeAmount: 5000,
      tradingFees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    stats: {
      marketCap: 8200000000,
      circulatingSupply: 552000000,
      totalSupply: 1000000000,
      allTimeHigh: 52.70,
      allTimeLow: 0.148
    }
  }
];

async function seedMarkets() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laevitas-crypto');
    console.log('Connecté à MongoDB');

    // Supprimer les marchés existants
    await Market.deleteMany({});
    console.log('Marchés existants supprimés');

    // Insérer les nouveaux marchés
    const insertedMarkets = await Market.insertMany(sampleMarkets);
    console.log(`${insertedMarkets.length} marchés ajoutés avec succès`);

    // Afficher les marchés ajoutés
    insertedMarkets.forEach(market => {
      console.log(`- ${market.symbol}: ${market.name} (${market.marketData.lastPrice} ${market.quoteAsset})`);
    });

    console.log('\nSeed des marchés terminé avec succès!');
    
  } catch (error) {
    console.error('Erreur lors du seed des marchés:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedMarkets();
}

module.exports = seedMarkets;