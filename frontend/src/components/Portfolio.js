import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { portfolioService } from '../services/api';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    amount: '',
    purchasePrice: ''
  });
  const [newTransaction, setNewTransaction] = useState({
    type: 'buy',
    symbol: '',
    amount: '',
    price: '',
    notes: ''
  });

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      const [portfolioData, transactionsData] = await Promise.all([
        portfolioService.getPortfolio(),
        portfolioService.getTransactions()
      ]);
      setPortfolio(portfolioData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erreur lors du chargement du portefeuille:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await portfolioService.addAsset(newAsset);
      setNewAsset({ symbol: '', amount: '', purchasePrice: '' });
      setShowAddAsset(false);
      loadPortfolioData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'actif:', error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await portfolioService.addTransaction(newTransaction);
      setNewTransaction({ type: 'buy', symbol: '', amount: '', price: '', notes: '' });
      setShowAddTransaction(false);
      loadPortfolioData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la transaction:', error);
    }
  };

  const handleRemoveAsset = async (symbol) => {
    try {
      await portfolioService.removeAsset(symbol);
      loadPortfolioData();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'actif:', error);
    }
  };

  const updatePrices = async () => {
    try {
      await portfolioService.updatePrices();
      loadPortfolioData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des prix:', error);
    }
  };

  const AssetCard = ({ asset }) => {
    const isPositive = (asset.change24h || 0) >= 0;
    const currentPrice = asset.currentPrice || 0;
    const averagePrice = asset.averagePrice || asset.purchasePrice || 0;
    const amount = asset.amount || asset.quantity || 0;
    const currentValue = asset.currentValue || (currentPrice * amount) || 0;
    
    const profitLoss = (currentPrice - averagePrice) * amount;
    const profitLossPercent = averagePrice > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;

    return (
      <div className="card hover:bg-gray-750 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{(asset.symbol || '').toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-lg">{(asset.symbol || '').toUpperCase()}</h3>
              <p className="text-gray-400 text-sm">{amount} {(asset.symbol || '').toUpperCase()}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-white font-bold text-lg">${currentValue.toLocaleString()}</p>
            <div className={`flex items-center justify-end text-sm ${
              profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {profitLoss >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitLossPercent.toFixed(2)}%)</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setSelectedAsset(asset)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRemoveAsset(asset.symbol)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Prix moyen</p>
              <p className="text-white font-medium">${asset.averagePrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400">Prix actuel</p>
              <p className="text-white font-medium">${asset.currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400">24h</p>
              <p className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TransactionItem = ({ transaction }) => {
    const amount = transaction.amount || transaction.quantity || 0;
    const price = transaction.price || 0;
    const symbol = transaction.symbol || '';
    const totalAmount = amount * price;
    const date = transaction.date || transaction.timestamp || new Date();
    
    return (
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            transaction.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {transaction.type === 'buy' ? (
              <PlusIcon className="h-5 w-5 text-white" />
            ) : (
              <MinusIcon className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h4 className="text-white font-medium">
              {transaction.type === 'buy' ? 'Achat' : 'Vente'} {symbol.toUpperCase()}
            </h4>
            <p className="text-gray-400 text-sm">{amount} {symbol.toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-medium">${totalAmount.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">${price.toFixed(2)} par unité</p>
        </div>
        <div className="text-right ml-4">
          <p className="text-gray-400 text-sm">{new Date(date).toLocaleDateString()}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon Portefeuille</h1>
          <p className="text-gray-400 mt-1">Gérez vos investissements en cryptomonnaies</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={updatePrices}
            className="btn-secondary"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Actualiser
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="btn-secondary"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Transaction
          </button>
          <button
            onClick={() => setShowAddAsset(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter Actif
          </button>
        </div>
      </div>

      {/* Statistiques du portefeuille */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Valeur Totale</p>
                <p className="text-2xl font-bold text-white">${(portfolio.totalValue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-lg">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Gain/Perte Total</p>
                <p className={`text-2xl font-bold ${
                  (portfolio.totalProfitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(portfolio.totalProfitLoss || 0) >= 0 ? '+' : ''}${(portfolio.totalProfitLoss || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 bg-opacity-20 rounded-lg">
                <ChartBarIcon className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Nombre d'Actifs</p>
                <p className="text-2xl font-bold text-white">{portfolio.assets.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des actifs */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Mes Actifs</h2>
          <button
            onClick={() => setShowAddAsset(true)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            + Ajouter un actif
          </button>
        </div>
        
        {portfolio && portfolio.assets.length > 0 ? (
          <div className="space-y-4">
            {portfolio.assets.map((asset, index) => (
              <AssetCard key={index} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun actif dans votre portefeuille</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter vos premiers investissements</p>
            <button
              onClick={() => setShowAddAsset(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter votre premier actif
            </button>
          </div>
        )}
      </div>

      {/* Historique des transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Historique des Transactions</h2>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            + Nouvelle transaction
          </button>
        </div>
        
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction, index) => (
              <TransactionItem key={index} transaction={transaction} />
            ))}
            {transactions.length > 5 && (
              <button className="w-full mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
                Voir toutes les transactions ({transactions.length})
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune transaction enregistrée</p>
          </div>
        )}
      </div>

      {/* Modal d'ajout d'actif */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Ajouter un Actif</h3>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbole (ex: BTC, ETH)
                </label>
                <input
                  type="text"
                  value={newAsset.symbol}
                  onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantité
                </label>
                <input
                  type="number"
                  step="any"
                  value={newAsset.amount}
                  onChange={(e) => setNewAsset({...newAsset, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prix d'achat moyen ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newAsset.purchasePrice}
                  onChange={(e) => setNewAsset({...newAsset, purchasePrice: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAsset(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout de transaction */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Nouvelle Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="buy">Achat</option>
                  <option value="sell">Vente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbole
                </label>
                <input
                  type="text"
                  value={newTransaction.symbol}
                  onChange={(e) => setNewTransaction({...newTransaction, symbol: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantité
                </label>
                <input
                  type="number"
                  step="any"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prix ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newTransaction.price}
                  onChange={(e) => setNewTransaction({...newTransaction, price: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;