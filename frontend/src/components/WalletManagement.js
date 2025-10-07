import React, { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import walletService from '../services/walletService';
import portfolioSyncService from '../services/portfolioSyncService';
import LoadingSpinner from './LoadingSpinner';
import { DepositModal, WithdrawModal } from './WalletModals';

const WalletManagement = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    type: '',
    currency: '',
    status: '',
    page: 1
  });

  useEffect(() => {
    loadWalletData();
  }, []);

  // Rafraîchissement automatique pour les transactions en attente
  useEffect(() => {
    const hasPendingTransactions = transactions.some(t => t.status === 'pending');
    
    if (hasPendingTransactions) {
      const interval = setInterval(() => {
        loadWalletData();
      }, 10000); // Rafraîchir toutes les 10 secondes
      
      return () => clearInterval(interval);
    }
  }, [transactions]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, transactionsData] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(transactionFilters)
      ]);
      
      setWallet(walletData.data);
      setTransactions(transactionsData.data.transactions || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setTransactionFilters(newFilters);
  };

  const handleRefresh = () => {
    loadWalletData();
  };

  const handleDepositSuccess = async (result) => {
    console.log('Dépôt réussi:', result);
    try {
      // Synchroniser avec le portfolio et dashboard
      await portfolioSyncService.syncAfterTransaction('deposit', result);
      // Recharger les données locales
      await loadWalletData();
    } catch (error) {
      console.error('Erreur lors de la synchronisation après dépôt:', error);
      // Fallback: recharger seulement les données du wallet
      await loadWalletData();
    }
  };

  const handleWithdrawSuccess = async (result) => {
    console.log('Retrait réussi:', result);
    try {
      // Synchroniser avec le portfolio et dashboard
      await portfolioSyncService.syncAfterTransaction('withdraw', result);
      // Recharger les données locales
      await loadWalletData();
    } catch (error) {
      console.error('Erreur lors de la synchronisation après retrait:', error);
      // Fallback: recharger seulement les données du wallet
      await loadWalletData();
    }
  };



  if (loading) {
    return <LoadingSpinner text="Chargement du portefeuille..." />;
  }

  const stats = wallet ? walletService.getWalletStats(transactions, wallet.balances) : null;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white">Gestion des Fonds</h2>
            {pendingCount > 0 && (
              <div className="flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
                <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-yellow-400 font-medium">
                  {pendingCount} transaction{pendingCount > 1 ? 's' : ''} en cours
                </span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Déposer</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <MinusIcon className="h-5 w-5" />
              <span>Retirer</span>
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30">
              <div className="flex items-center">
                <BanknotesIcon className="h-8 w-8 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-300">Valeur Totale</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-800/20 backdrop-blur-sm p-4 rounded-lg border border-green-500/30">
              <div className="flex items-center">
                <ArrowDownIcon className="h-8 w-8 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-300">Dépôts (30j)</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalDeposits.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-600/20 to-pink-800/20 backdrop-blur-sm p-4 rounded-lg border border-red-500/30">
              <div className="flex items-center">
                <ArrowUpIcon className="h-8 w-8 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-300">Retraits (30j)</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalWithdrawals.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600/20 to-indigo-800/20 backdrop-blur-sm p-4 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-purple-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-300">Transactions</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.transactionCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50">
        <div className="border-b border-gray-700/50">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: EyeIcon },
              { id: 'transactions', name: 'Transactions', icon: DocumentTextIcon },
              { id: 'settings', name: 'Paramètres', icon: CogIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <BalanceOverview balances={wallet?.balances || []} />
          )}
          
          {activeTab === 'transactions' && (
            <TransactionHistory 
              transactions={transactions}
              filters={transactionFilters}
              onFiltersChange={setTransactionFilters}
              onRefresh={loadWalletData}
            />
          )}
          
          {activeTab === 'settings' && (
            <WalletSettings 
              settings={wallet?.settings || {}}
              verification={wallet?.verification || {}}
              onUpdate={loadWalletData}
            />
          )}
        </div>
      </div>

      {/* Modales */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={(result) => {
          handleDepositSuccess(result);
          setShowDepositModal(false);
        }}
        balances={wallet?.balances || []}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={(result) => {
          handleWithdrawSuccess(result);
          setShowWithdrawModal(false);
        }}
        balances={wallet?.balances || []}
      />
    </div>
  );
};

// Composant Vue d'ensemble des soldes
const BalanceOverview = ({ balances }) => {
  const currencies = walletService.getSupportedCurrencies();
  
  // Calculer la valeur totale
  const totalValue = balances?.reduce((sum, balance) => {
    return sum + (balance.total * (balance.usdValue || 0));
  }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Valeur totale du portefeuille</h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              ${walletService.formatAmount(totalValue, 'USD')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300 font-medium">Nombre d'actifs</p>
            <p className="text-2xl font-bold text-white">
              {balances?.filter(b => b.total > 0).length || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Soldes par devise</h3>
        <div className="text-sm text-gray-300 font-medium">
          {currencies.length} devises supportées
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currencies.map((currency) => {
          const balance = balances?.find(b => b.currency === currency.code) || {
            currency: currency.code,
            available: 0,
            locked: 0,
            total: 0,
            usdValue: 0
          };

          const hasBalance = balance.total > 0;
          const usdValue = balance.total * (balance.usdValue || 0);

          return (
            <div 
              key={currency.code} 
              className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${
                hasBalance 
                  ? 'border-blue-500/30 bg-blue-600/10 hover:border-blue-400/50 hover:bg-blue-600/20' 
                  : 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50 hover:bg-gray-700/30'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currency.type === 'crypto' 
                      ? hasBalance ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-gray-700/50 text-gray-500 border border-gray-600/30'
                      : hasBalance ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700/50 text-gray-500 border border-gray-600/30'
                  }`}>
                    <span className="text-sm font-bold">{currency.symbol}</span>
                  </div>
                  <div>
                    <p className={`font-medium ${hasBalance ? 'text-white' : 'text-gray-300'}`}>
                      {currency.code}
                    </p>
                    <p className={`text-xs ${hasBalance ? 'text-gray-300' : 'text-gray-500'}`}>{currency.name}</p>
                  </div>
                </div>
                {hasBalance && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      ${walletService.formatAmount(usdValue, 'USD')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 font-medium">Disponible:</span>
                  <span className={`text-sm font-semibold ${hasBalance ? 'text-white' : 'text-gray-400'}`}>
                    {walletService.formatAmount(balance.available, currency.code)}
                  </span>
                </div>
                
                {balance.locked > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-medium">Bloqué:</span>
                    <span className="text-sm font-semibold text-orange-400">
                      {walletService.formatAmount(balance.locked, currency.code)}
                    </span>
                  </div>
                )}
                
                <div className={`flex justify-between items-center pt-2 ${hasBalance ? 'border-t border-gray-600/30' : ''}`}>
                  <span className={`text-sm font-semibold ${hasBalance ? 'text-white' : 'text-gray-300'}`}>
                    Total:
                  </span>
                  <span className={`text-sm font-bold ${hasBalance ? 'text-white' : 'text-gray-300'}`}>
                    {walletService.formatAmount(balance.total, currency.code)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Message si aucun solde */}
      {(!balances || balances.filter(b => b.total > 0).length === 0) && (
        <div className="text-center py-8">
          <BanknotesIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun solde disponible</h3>
          <p className="text-gray-300 mb-4 font-medium">
            Commencez par effectuer un dépôt pour voir vos soldes ici.
          </p>
        </div>
      )}
    </div>
  );
};

// Composant Historique des transactions
const TransactionHistory = ({ transactions, filters, onFiltersChange, onRefresh }) => {
  const currencies = walletService.getSupportedCurrencies();
  
  // Séparer les transactions en attente des autres
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const otherTransactions = transactions.filter(t => t.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Historique des transactions</h3>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Section des transactions en attente */}
      {pendingTransactions.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-yellow-400" />
              <h4 className="text-sm font-medium text-yellow-400">
                Transactions en cours de traitement ({pendingTransactions.length})
              </h4>
            </div>
            <div className="flex items-center space-x-2 text-xs text-yellow-300">
              <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Traitement en cours...</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {pendingTransactions.map((transaction) => (
              <PendingTransactionCard key={transaction._id} transaction={transaction} />
            ))}
          </div>
          
          <div className="mt-3 text-xs text-yellow-300 bg-yellow-500/5 rounded p-2">
            💡 Les dépôts sont généralement traités en 5-10 minutes. Les retraits peuvent prendre jusqu'à 24h.
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          className="bg-gray-800/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tous les types</option>
          <option value="deposit">Dépôts</option>
          <option value="withdrawal">Retraits</option>
          <option value="trade_buy">Achats</option>
          <option value="trade_sell">Ventes</option>
        </select>

        <select
          value={filters.currency}
          onChange={(e) => onFiltersChange({ ...filters, currency: e.target.value })}
          className="bg-gray-800/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Toutes les devises</option>
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>{currency.code}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="bg-gray-800/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="completed">Terminé</option>
          <option value="failed">Échoué</option>
        </select>
      </div>

      {/* Liste des transactions */}
      <div className="overflow-hidden shadow-lg ring-1 ring-gray-600/30 md:rounded-lg backdrop-blur-sm">
        <table className="min-w-full divide-y divide-gray-600/50">
          <thead className="bg-gray-800/70">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Référence
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/30 divide-y divide-gray-600/30">
            {otherTransactions.map((transaction) => {
              const typeInfo = walletService.getTransactionType(transaction.type);
              const statusInfo = walletService.getTransactionStatus(transaction.status);

              return (
                <tr key={transaction._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        typeInfo.color === 'green' ? 'bg-green-500/20 border border-green-500/30' :
                        typeInfo.color === 'red' ? 'bg-red-500/20 border border-red-500/30' :
                        'bg-blue-500/20 border border-blue-500/30'
                      }`}>
                        {typeInfo.icon === 'arrow-down' && <ArrowDownIcon className={`h-4 w-4 ${
                          typeInfo.color === 'green' ? 'text-green-400' :
                          typeInfo.color === 'red' ? 'text-red-400' :
                          'text-blue-400'
                        }`} />}
                        {typeInfo.icon === 'arrow-up' && <ArrowUpIcon className={`h-4 w-4 ${
                          typeInfo.color === 'green' ? 'text-green-400' :
                          typeInfo.color === 'red' ? 'text-red-400' :
                          'text-blue-400'
                        }`} />}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">{typeInfo.label}</p>
                        <p className="text-sm text-gray-300">{transaction.method}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white font-medium">
                      {walletService.formatAmount(transaction.amount, transaction.currency)} {transaction.currency}
                    </div>
                    {transaction.fees && transaction.fees.amount > 0 && (
                      <div className="text-sm text-gray-400">
                        Frais: {walletService.formatAmount(transaction.fees.amount, transaction.fees.currency)} {transaction.fees.currency}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusInfo.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      statusInfo.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      statusInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {statusInfo.icon === 'clock' && <ClockIcon className="h-3 w-3 mr-1" />}
                      {statusInfo.icon === 'check' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                      {statusInfo.icon === 'x' && <XCircleIcon className="h-3 w-3 mr-1" />}
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {transaction.externalReference}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {otherTransactions.length === 0 && pendingTransactions.length === 0 && (
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">Aucune transaction</h3>
          <p className="mt-1 text-sm text-gray-300">
            Commencez par effectuer un dépôt pour voir vos transactions ici.
          </p>
        </div>
      )}
    </div>
  );
};

// Composant pour les transactions en attente
const PendingTransactionCard = ({ transaction }) => {
  const typeInfo = walletService.getTransactionType(transaction.type);
  const [timeElapsed, setTimeElapsed] = useState('');

  // Calculer le temps écoulé depuis la création
  useEffect(() => {
    const updateTimeElapsed = () => {
      const now = new Date();
      const created = new Date(transaction.createdAt);
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      if (diffMins > 0) {
        setTimeElapsed(`${diffMins}m ${diffSecs}s`);
      } else {
        setTimeElapsed(`${diffSecs}s`);
      }
    };

    updateTimeElapsed();
    const interval = setInterval(updateTimeElapsed, 1000);
    return () => clearInterval(interval);
  }, [transaction.createdAt]);

  // Calculer la progression estimée (basée sur le temps écoulé)
  const getProgress = () => {
    const now = new Date();
    const created = new Date(transaction.createdAt);
    const diffMs = now - created;
    const diffMins = diffMs / 60000;
    
    // Pour les dépôts : progression sur 5 minutes
    if (transaction.type === 'deposit') {
      return Math.min((diffMins / 5) * 100, 95); // Max 95% jusqu'à completion
    }
    
    // Pour les retraits : progression sur 30 minutes
    if (transaction.type === 'withdrawal') {
      return Math.min((diffMins / 30) * 100, 95);
    }
    
    return 50; // Défaut
  };

  const progress = getProgress();

  return (
    <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            typeInfo.color === 'green' ? 'bg-green-500/20 border border-green-500/30' :
            typeInfo.color === 'red' ? 'bg-red-500/20 border border-red-500/30' :
            'bg-blue-500/20 border border-blue-500/30'
          }`}>
            {typeInfo.icon === 'arrow-down' && <ArrowDownIcon className={`h-4 w-4 ${
              typeInfo.color === 'green' ? 'text-green-400' :
              typeInfo.color === 'red' ? 'text-red-400' :
              'text-blue-400'
            }`} />}
            {typeInfo.icon === 'arrow-up' && <ArrowUpIcon className={`h-4 w-4 ${
              typeInfo.color === 'green' ? 'text-green-400' :
              typeInfo.color === 'red' ? 'text-red-400' :
              'text-blue-400'
            }`} />}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-white">{typeInfo.label}</p>
              <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                En cours
              </span>
            </div>
            <p className="text-xs text-gray-400">{transaction.method} • {timeElapsed}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-white">
            {walletService.formatAmount(transaction.amount, transaction.currency)} {transaction.currency}
          </p>
          <p className="text-xs text-gray-400">
            Réf: {transaction.externalReference}
          </p>
        </div>
      </div>
      
      {/* Barre de progression */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-yellow-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Composant Paramètres du portefeuille
const WalletSettings = ({ settings, verification, onUpdate }) => {
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await walletService.updateSettings(formData);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Paramètres du portefeuille</h3>

      {/* Niveau de vérification */}
      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-300">
              Niveau de vérification: {verification.level}/3
            </h4>
            <p className="text-sm text-blue-200">
              Augmentez votre niveau de vérification pour des limites plus élevées.
            </p>
          </div>
        </div>
      </div>

      {/* Limites actuelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-600/30 bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white mb-2">Limites de dépôt</h4>
          <div className="space-y-1 text-sm text-gray-300">
            <p>Quotidien: ${verification.limits?.dailyDeposit?.toLocaleString()}</p>
            <p>Mensuel: ${verification.limits?.monthlyDeposit?.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="border border-gray-600/30 bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white mb-2">Limites de retrait</h4>
          <div className="space-y-1 text-sm text-gray-300">
            <p>Quotidien: ${verification.limits?.dailyWithdrawal?.toLocaleString()}</p>
            <p>Mensuel: ${verification.limits?.monthlyWithdrawal?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Formulaire de paramètres */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Devise par défaut
          </label>
          <select
            value={formData.defaultCurrency || 'USD'}
            onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
            className="mt-1 block w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="USD">USD - Dollar américain</option>
            <option value="EUR">EUR - Euro</option>
            <option value="BTC">BTC - Bitcoin</option>
            <option value="ETH">ETH - Ethereum</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoConvert"
            checked={formData.autoConvert || false}
            onChange={(e) => setFormData({ ...formData, autoConvert: e.target.checked })}
            className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="autoConvert" className="ml-2 text-sm text-gray-300">
            Conversion automatique vers la devise par défaut
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-white">Notifications</h4>
          
          {[
            { key: 'deposits', label: 'Dépôts' },
            { key: 'withdrawals', label: 'Retraits' },
            { key: 'lowBalance', label: 'Solde faible' }
          ].map((notification) => (
            <div key={notification.key} className="flex items-center">
              <input
                type="checkbox"
                id={notification.key}
                checked={formData.notifications?.[notification.key] || false}
                onChange={(e) => setFormData({
                  ...formData,
                  notifications: {
                    ...formData.notifications,
                    [notification.key]: e.target.checked
                  }
                })}
                className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor={notification.key} className="ml-2 text-sm text-gray-300">
                {notification.label}
              </label>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
};



export default WalletManagement;