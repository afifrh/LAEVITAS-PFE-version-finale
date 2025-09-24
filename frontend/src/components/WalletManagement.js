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
  MinusIcon
} from '@heroicons/react/24/outline';
import walletService from '../services/walletService';
import LoadingSpinner from './LoadingSpinner';

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

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, transactionsData] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions({ limit: 10 })
      ]);
      
      setWallet(walletData.data);
      setTransactions(transactionsData.data.transactions);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (depositData) => {
    try {
      await walletService.deposit(depositData);
      setShowDepositModal(false);
      loadWalletData();
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
    }
  };

  const handleWithdraw = async (withdrawalData) => {
    try {
      await walletService.withdraw(withdrawalData);
      setShowWithdrawModal(false);
      loadWalletData();
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du portefeuille..." />;
  }

  const stats = wallet ? walletService.getWalletStats(transactions, wallet.balances) : null;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Fonds</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Déposer</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <MinusIcon className="h-5 w-5" />
              <span>Retirer</span>
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BanknotesIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Valeur Totale</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ArrowDownIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Dépôts (30j)</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${stats.totalDeposits.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ArrowUpIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Retraits (30j)</p>
                  <p className="text-2xl font-bold text-red-900">
                    ${stats.totalWithdrawals.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Transactions</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.transactionCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
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
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
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
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onSubmit={handleDeposit}
          balances={wallet?.balances || []}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onSubmit={handleWithdraw}
          balances={wallet?.balances || []}
        />
      )}
    </div>
  );
};

// Composant Vue d'ensemble des soldes
const BalanceOverview = ({ balances }) => {
  const currencies = walletService.getSupportedCurrencies();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Soldes par devise</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencies.map((currency) => {
          const balance = balances.find(b => b.currency === currency.code) || {
            currency: currency.code,
            available: 0,
            locked: 0,
            total: 0
          };

          return (
            <div key={currency.code} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currency.type === 'crypto' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    <span className="text-sm font-bold">{currency.symbol}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{currency.code}</p>
                    <p className="text-sm text-gray-500">{currency.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Disponible:</span>
                  <span className="text-sm font-medium">
                    {walletService.formatAmount(balance.available, currency.code)} {currency.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Bloqué:</span>
                  <span className="text-sm font-medium">
                    {walletService.formatAmount(balance.locked, currency.code)} {currency.code}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {walletService.formatAmount(balance.total, currency.code)} {currency.code}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant Historique des transactions
const TransactionHistory = ({ transactions, filters, onFiltersChange, onRefresh }) => {
  const currencies = walletService.getSupportedCurrencies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Historique des transactions</h3>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2"
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
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Toutes les devises</option>
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>{currency.code}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="completed">Terminé</option>
          <option value="failed">Échoué</option>
        </select>
      </div>

      {/* Liste des transactions */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const typeInfo = walletService.getTransactionType(transaction.type);
              const statusInfo = walletService.getTransactionStatus(transaction.status);

              return (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-${typeInfo.color}-100`}>
                        {typeInfo.icon === 'arrow-down' && <ArrowDownIcon className={`h-4 w-4 text-${typeInfo.color}-600`} />}
                        {typeInfo.icon === 'arrow-up' && <ArrowUpIcon className={`h-4 w-4 text-${typeInfo.color}-600`} />}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{typeInfo.label}</p>
                        <p className="text-sm text-gray-500">{transaction.method}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {walletService.formatAmount(transaction.amount, transaction.currency)} {transaction.currency}
                    </div>
                    {transaction.fees && transaction.fees.amount > 0 && (
                      <div className="text-sm text-gray-500">
                        Frais: {walletService.formatAmount(transaction.fees.amount, transaction.fees.currency)} {transaction.fees.currency}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                      {statusInfo.icon === 'clock' && <ClockIcon className="h-3 w-3 mr-1" />}
                      {statusInfo.icon === 'check' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                      {statusInfo.icon === 'x' && <XCircleIcon className="h-3 w-3 mr-1" />}
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.externalReference}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune transaction</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par effectuer un dépôt pour voir vos transactions ici.
          </p>
        </div>
      )}
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
      <h3 className="text-lg font-medium text-gray-900">Paramètres du portefeuille</h3>

      {/* Niveau de vérification */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Niveau de vérification: {verification.level}/3
            </h4>
            <p className="text-sm text-blue-700">
              Augmentez votre niveau de vérification pour des limites plus élevées.
            </p>
          </div>
        </div>
      </div>

      {/* Limites actuelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Limites de dépôt</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Quotidien: ${verification.limits?.dailyDeposit?.toLocaleString()}</p>
            <p>Mensuel: ${verification.limits?.monthlyDeposit?.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Limites de retrait</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Quotidien: ${verification.limits?.dailyWithdrawal?.toLocaleString()}</p>
            <p>Mensuel: ${verification.limits?.monthlyWithdrawal?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Formulaire de paramètres */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Devise par défaut
          </label>
          <select
            value={formData.defaultCurrency || 'USD'}
            onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="autoConvert" className="ml-2 text-sm text-gray-700">
            Conversion automatique vers la devise par défaut
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Notifications</h4>
          
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
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor={notification.key} className="ml-2 text-sm text-gray-700">
                {notification.label}
              </label>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
};

// Composants modales (à implémenter séparément)
const DepositModal = ({ onClose, onSubmit, balances }) => {
  // Implémentation de la modale de dépôt
  return <div>Modale de dépôt (à implémenter)</div>;
};

const WithdrawModal = ({ onClose, onSubmit, balances }) => {
  // Implémentation de la modale de retrait
  return <div>Modale de retrait (à implémenter)</div>;
};

export default WalletManagement;