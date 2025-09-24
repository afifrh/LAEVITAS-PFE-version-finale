import api from './api';

class WalletService {
  // Obtenir le portefeuille de l'utilisateur
  async getWallet() {
    try {
      const response = await api.get('/wallet');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du portefeuille:', error);
      throw error;
    }
  }

  // Obtenir le solde d'une devise spécifique
  async getBalance(currency) {
    try {
      const response = await api.get(`/wallet/balance/${currency}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du solde ${currency}:`, error);
      throw error;
    }
  }

  // Initier un dépôt
  async deposit(depositData) {
    try {
      const response = await api.post('/wallet/deposit', depositData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      throw error;
    }
  }

  // Initier un retrait
  async withdraw(withdrawalData) {
    try {
      const response = await api.post('/wallet/withdraw', withdrawalData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      throw error;
    }
  }

  // Obtenir l'historique des transactions
  async getTransactions(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/wallet/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw error;
    }
  }

  // Obtenir une transaction spécifique
  async getTransaction(transactionId) {
    try {
      const response = await api.get(`/wallet/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la transaction:', error);
      throw error;
    }
  }

  // Mettre à jour les paramètres du portefeuille
  async updateSettings(settings) {
    try {
      const response = await api.put('/wallet/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }

  // Calculer les frais de retrait
  calculateWithdrawalFees(amount, currency, method) {
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

  // Valider un montant
  validateAmount(amount, currency, balance) {
    const errors = [];
    
    if (!amount || isNaN(amount) || amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    
    if (amount > 1000000) {
      errors.push('Le montant est trop élevé');
    }
    
    if (balance && amount > balance.available) {
      errors.push('Fonds insuffisants');
    }
    
    // Montants minimums par devise
    const minimums = {
      USD: 1,
      EUR: 1,
      BTC: 0.0001,
      ETH: 0.001,
      USDT: 1,
      BNB: 0.01
    };
    
    const minimum = minimums[currency] || 1;
    if (amount < minimum) {
      errors.push(`Le montant minimum pour ${currency} est ${minimum}`);
    }
    
    return errors;
  }

  // Formater un montant selon la devise
  formatAmount(amount, currency) {
    const decimals = {
      USD: 2,
      EUR: 2,
      BTC: 8,
      ETH: 6,
      USDT: 2,
      BNB: 4
    };
    
    const decimal = decimals[currency] || 2;
    return parseFloat(amount).toFixed(decimal);
  }

  // Obtenir les devises supportées
  getSupportedCurrencies() {
    return [
      { code: 'USD', name: 'Dollar américain', symbol: '$', type: 'fiat' },
      { code: 'EUR', name: 'Euro', symbol: '€', type: 'fiat' },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto' },
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'crypto' },
      { code: 'USDT', name: 'Tether', symbol: '₮', type: 'crypto' },
      { code: 'BNB', name: 'Binance Coin', symbol: 'BNB', type: 'crypto' }
    ];
  }

  // Obtenir les méthodes de paiement disponibles
  getPaymentMethods(type = 'deposit') {
    const methods = {
      deposit: [
        {
          id: 'bank_transfer',
          name: 'Virement bancaire',
          description: 'Virement SEPA (1-2 jours ouvrables)',
          fees: 'Gratuit',
          currencies: ['USD', 'EUR'],
          limits: { min: 10, max: 50000 }
        },
        {
          id: 'credit_card',
          name: 'Carte de crédit',
          description: 'Visa/Mastercard (Instantané)',
          fees: '2.5%',
          currencies: ['USD', 'EUR'],
          limits: { min: 10, max: 5000 }
        },
        {
          id: 'crypto_wallet',
          name: 'Portefeuille crypto',
          description: 'Transfert depuis un wallet externe',
          fees: 'Frais réseau',
          currencies: ['BTC', 'ETH', 'USDT', 'BNB'],
          limits: { min: 0.001, max: 100 }
        }
      ],
      withdrawal: [
        {
          id: 'bank_transfer',
          name: 'Virement bancaire',
          description: 'Virement SEPA (1-3 jours ouvrables)',
          fees: '5 USD + 0.1%',
          currencies: ['USD', 'EUR'],
          limits: { min: 50, max: 50000 }
        },
        {
          id: 'crypto_wallet',
          name: 'Portefeuille crypto',
          description: 'Transfert vers un wallet externe',
          fees: 'Frais réseau + 0.5%',
          currencies: ['BTC', 'ETH', 'USDT', 'BNB'],
          limits: { min: 0.001, max: 100 }
        }
      ]
    };
    
    return methods[type] || [];
  }

  // Obtenir le statut d'une transaction avec couleur
  getTransactionStatus(status) {
    const statuses = {
      pending: { label: 'En attente', color: 'yellow', icon: 'clock' },
      processing: { label: 'En cours', color: 'blue', icon: 'refresh' },
      completed: { label: 'Terminé', color: 'green', icon: 'check' },
      failed: { label: 'Échoué', color: 'red', icon: 'x' },
      cancelled: { label: 'Annulé', color: 'gray', icon: 'x-circle' }
    };
    
    return statuses[status] || statuses.pending;
  }

  // Obtenir le type de transaction avec couleur
  getTransactionType(type) {
    const types = {
      deposit: { label: 'Dépôt', color: 'green', icon: 'arrow-down' },
      withdrawal: { label: 'Retrait', color: 'red', icon: 'arrow-up' },
      trade_buy: { label: 'Achat', color: 'blue', icon: 'trending-up' },
      trade_sell: { label: 'Vente', color: 'orange', icon: 'trending-down' },
      fee: { label: 'Frais', color: 'gray', icon: 'credit-card' },
      bonus: { label: 'Bonus', color: 'purple', icon: 'gift' }
    };
    
    return types[type] || types.deposit;
  }

  // Calculer la valeur totale du portefeuille en USD
  calculateTotalValue(balances, prices = {}) {
    const defaultPrices = {
      USD: 1,
      EUR: 0.85,
      BTC: 45000,
      ETH: 3000,
      USDT: 1,
      BNB: 300
    };
    
    const currentPrices = { ...defaultPrices, ...prices };
    
    return balances.reduce((total, balance) => {
      const price = currentPrices[balance.currency] || 1;
      return total + (balance.total * price);
    }, 0);
  }

  // Obtenir les statistiques du portefeuille
  getWalletStats(transactions, balances) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= thirtyDaysAgo && t.status === 'completed'
    );
    
    const deposits = recentTransactions.filter(t => t.type === 'deposit');
    const withdrawals = recentTransactions.filter(t => t.type === 'withdrawal');
    
    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const totalValue = this.calculateTotalValue(balances);
    
    return {
      totalValue,
      totalDeposits,
      totalWithdrawals,
      netFlow: totalDeposits - totalWithdrawals,
      transactionCount: recentTransactions.length,
      averageTransaction: recentTransactions.length > 0 
        ? (totalDeposits + totalWithdrawals) / recentTransactions.length 
        : 0
    };
  }
}

export default new WalletService();