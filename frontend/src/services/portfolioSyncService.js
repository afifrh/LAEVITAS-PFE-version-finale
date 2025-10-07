import walletService from './walletService';
import { portfolioService } from './api';

class PortfolioSyncService {
  constructor() {
    this.listeners = [];
    this.lastWalletData = null;
    this.lastPortfolioData = null;
  }

  // Ajouter un listener pour les changements de données
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notifier tous les listeners
  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Erreur dans le listener:', error);
      }
    });
  }

  // Synchroniser les données du wallet avec le portfolio
  async syncWalletToPortfolio(walletData) {
    try {
      if (!walletData || !walletData.balances) {
        return;
      }

      // Convertir les soldes du wallet en actifs du portfolio
      const portfolioAssets = [];
      
      for (const balance of walletData.balances) {
        if (balance.total > 0) {
          // Récupérer le prix actuel de l'actif
          const currentPrice = await this.getCurrentPrice(balance.currency);
          
          portfolioAssets.push({
            symbol: balance.currency,
            name: this.getCurrencyName(balance.currency),
            type: 'crypto',
            quantity: balance.total,
            averagePrice: currentPrice, // Pour simplifier, on utilise le prix actuel
            currentPrice: currentPrice,
            investedValue: balance.total * currentPrice,
            currentValue: balance.total * currentPrice,
            change24h: 0, // À calculer avec les données de marché
            changePercent24h: 0
          });
        }
      }

      // Mettre à jour le portfolio avec les nouvelles données
      const portfolioData = {
        assets: portfolioAssets,
        totalValue: portfolioAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
        totalInvested: portfolioAssets.reduce((sum, asset) => sum + asset.investedValue, 0),
        totalPnL: 0, // Calculé automatiquement
        totalPnLPercent: 0
      };

      this.lastPortfolioData = portfolioData;
      this.notifyListeners({
        type: 'portfolio_updated',
        data: portfolioData
      });

      return portfolioData;
    } catch (error) {
      console.error('Erreur lors de la synchronisation wallet -> portfolio:', error);
      throw error;
    }
  }

  // Récupérer le prix actuel d'une devise
  async getCurrentPrice(currency) {
    try {
      // Si c'est une devise fiat, retourner 1
      if (['USD', 'EUR', 'GBP'].includes(currency.toUpperCase())) {
        return 1;
      }

      // Pour les cryptomonnaies, utiliser l'API de prix
      const response = await fetch(`/api/market/price/${currency.toUpperCase()}USDT`);
      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.price) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Erreur lors de la récupération du prix pour ${currency}:`, error);
      return 0;
    }
  }

  // Obtenir le nom complet d'une devise
  getCurrencyName(currency) {
    const currencyNames = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'XRP': 'Ripple',
      'LTC': 'Litecoin',
      'LINK': 'Chainlink',
      'BCH': 'Bitcoin Cash',
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound'
    };
    
    return currencyNames[currency.toUpperCase()] || currency.toUpperCase();
  }

  // Calculer les métriques du dashboard
  calculateDashboardMetrics(walletData, portfolioData) {
    if (!walletData || !portfolioData) {
      return null;
    }

    const totalBalance = walletData.balances?.reduce((sum, balance) => {
      return sum + (balance.total * (balance.usdValue || 0));
    }, 0) || 0;

    const totalAssets = portfolioData.assets?.length || 0;
    const totalValue = portfolioData.totalValue || 0;
    const totalPnL = portfolioData.totalPnL || 0;
    const totalPnLPercent = portfolioData.totalPnLPercent || 0;

    return {
      totalBalance,
      totalAssets,
      totalValue,
      totalPnL,
      totalPnLPercent,
      availableBalance: walletData.balances?.reduce((sum, balance) => {
        return sum + (balance.available * (balance.usdValue || 0));
      }, 0) || 0,
      lockedBalance: walletData.balances?.reduce((sum, balance) => {
        return sum + (balance.locked * (balance.usdValue || 0));
      }, 0) || 0
    };
  }

  // Synchroniser toutes les données
  async syncAllData() {
    try {
      // Récupérer les données du wallet
      const walletResponse = await walletService.getWallet();
      const walletData = walletResponse.data;
      this.lastWalletData = walletData;

      // Synchroniser avec le portfolio
      const portfolioData = await this.syncWalletToPortfolio(walletData);

      // Calculer les métriques du dashboard
      const dashboardMetrics = this.calculateDashboardMetrics(walletData, portfolioData);

      // Notifier tous les composants
      this.notifyListeners({
        type: 'full_sync',
        data: {
          wallet: walletData,
          portfolio: portfolioData,
          dashboard: dashboardMetrics
        }
      });

      return {
        wallet: walletData,
        portfolio: portfolioData,
        dashboard: dashboardMetrics
      };
    } catch (error) {
      console.error('Erreur lors de la synchronisation complète:', error);
      throw error;
    }
  }

  // Déclencher une synchronisation après une transaction
  async syncAfterTransaction(transactionType, transactionData) {
    try {
      console.log(`Synchronisation après ${transactionType}:`, transactionData);
      
      // Attendre un peu pour que la transaction soit traitée
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Synchroniser toutes les données
      return await this.syncAllData();
    } catch (error) {
      console.error('Erreur lors de la synchronisation après transaction:', error);
      throw error;
    }
  }

  // Obtenir les dernières données en cache
  getLastData() {
    return {
      wallet: this.lastWalletData,
      portfolio: this.lastPortfolioData
    };
  }
}

// Instance singleton
const portfolioSyncService = new PortfolioSyncService();

export default portfolioSyncService;