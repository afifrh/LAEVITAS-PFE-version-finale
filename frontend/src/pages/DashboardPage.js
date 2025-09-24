import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TradingDashboard from '../components/TradingDashboard';
import Portfolio from '../components/Portfolio';
import LoadingSpinner, { SkeletonLoader, CardSpinner } from '../components/LoadingSpinner';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  EyeIcon,
  BellIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ClockIcon,
  HomeIcon,
  ChartPieIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import {
  CurrencyDollarIcon as CurrencyDollarSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  EyeIcon as EyeSolidIcon,
  HomeIcon as HomeSolidIcon,
  ChartPieIcon as ChartPieSolidIcon,
  BriefcaseIcon as BriefcaseSolidIcon
} from '@heroicons/react/24/solid';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Configuration des onglets
  const tabs = [
    {
      id: 'overview',
      name: 'Aperçu',
      icon: HomeIcon,
      activeIcon: HomeSolidIcon,
      description: 'Vue d\'ensemble de votre portefeuille'
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      icon: BriefcaseIcon,
      activeIcon: BriefcaseSolidIcon,
      description: 'Gestion détaillée de votre portefeuille'
    },
    {
      id: 'trading',
      name: 'Trading',
      icon: ChartPieIcon,
      activeIcon: ChartPieSolidIcon,
      description: 'Dashboard de trading avec données en temps réel'
    }
  ];

  // Simulation de données de marché
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulation d'un appel API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setMarketData({
          btc: { price: 43250.50, change: 2.45, changePercent: 5.67 },
          eth: { price: 2580.75, change: -45.20, changePercent: -1.72 },
          bnb: { price: 315.80, change: 8.90, changePercent: 2.90 },
          ada: { price: 0.485, change: 0.012, changePercent: 2.53 }
        });

        setPortfolioData({
          totalValue: 12450.75,
          totalChange: 245.80,
          totalChangePercent: 2.01,
          assets: [
            { symbol: 'BTC', amount: 0.25, value: 10812.63, allocation: 86.8 },
            { symbol: 'ETH', amount: 0.5, value: 1290.38, allocation: 10.4 },
            { symbol: 'BNB', amount: 1.1, value: 347.38, allocation: 2.8 }
          ]
        });

        setNotifications([
          {
            id: 1,
            type: 'price_alert',
            title: 'Alerte de prix',
            message: 'BTC a atteint votre prix cible de 43,000$',
            time: '5 min',
            read: false
          },
          {
            id: 2,
            type: 'market_update',
            title: 'Mise à jour du marché',
            message: 'Le marché des cryptomonnaies est en hausse de 3.2%',
            time: '1h',
            read: false
          },
          {
            id: 3,
            type: 'system',
            title: 'Maintenance programmée',
            message: 'Maintenance du système prévue demain à 2h00',
            time: '3h',
            read: true
          }
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Composant de carte de statistique
  const StatCard = ({ title, value, change, changePercent, icon: Icon, trend }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{change} ({changePercent}%)</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${
          trend === 'up' ? 'bg-green-900 bg-opacity-50' : 
          trend === 'down' ? 'bg-red-900 bg-opacity-50' : 
          'bg-blue-900 bg-opacity-50'
        }`}>
          <Icon className={`h-6 w-6 ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 
            'text-blue-400'
          }`} />
        </div>
      </div>
    </div>
  );

  // Composant de carte de crypto
  const CryptoCard = ({ symbol, name, price, change, changePercent }) => {
    const isPositive = change > 0;
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{symbol}</span>
            </div>
            <div>
              <h3 className="text-white font-medium">{symbol}</h3>
              <p className="text-gray-400 text-sm">{name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">${price.toLocaleString()}</p>
            <div className={`flex items-center text-sm ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{isPositive ? '+' : ''}{changePercent}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Composant de notification
  const NotificationItem = ({ notification }) => (
    <div className={`p-4 border-l-4 ${
      notification.read ? 'border-gray-600 bg-gray-800' : 'border-blue-500 bg-blue-900 bg-opacity-20'
    } rounded-r-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${
            notification.read ? 'text-gray-300' : 'text-white'
          }`}>
            {notification.title}
          </h4>
          <p className={`text-sm mt-1 ${
            notification.read ? 'text-gray-400' : 'text-gray-300'
          }`}>
            {notification.message}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <span className="text-xs text-gray-500">{notification.time}</span>
          {!notification.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SkeletonLoader className="h-8 w-64" />
          <SkeletonLoader className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSpinner key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSpinner />
          <CardSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bonjour, {user?.firstName} ! 👋
          </h1>
          <p className="text-gray-400 mt-1">
            {activeTab === 'overview' 
              ? 'Voici un aperçu de votre portefeuille et du marché'
              : activeTab === 'portfolio'
              ? 'Gestion détaillée de votre portefeuille'
              : 'Dashboard de trading avec données en temps réel'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Paramètres
          </button>
          <button 
            className="btn-primary"
            onClick={() => setActiveTab('trading')}
          >
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Trader
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = activeTab === tab.id ? tab.activeIcon : tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                }`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu conditionnel selon l'onglet actif */}
      {activeTab === 'overview' ? (
        <>
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Valeur du portefeuille"
              value={`$${portfolioData?.totalValue.toLocaleString()}`}
              change={`+$${portfolioData?.totalChange.toFixed(2)}`}
              changePercent={portfolioData?.totalChangePercent.toFixed(2)}
              icon={CurrencyDollarSolidIcon}
              trend="up"
            />
            <StatCard
              title="Gain/Perte 24h"
              value={`+$${portfolioData?.totalChange.toFixed(2)}`}
              change={`${portfolioData?.totalChangePercent.toFixed(2)}%`}
              changePercent=""
              icon={ArrowTrendingUpIcon}
              trend="up"
            />
            <StatCard
              title="Nombre d'actifs"
              value={portfolioData?.assets.length.toString()}
              icon={ChartBarSolidIcon}
            />
            <StatCard
              title="Dernière mise à jour"
              value="Maintenant"
              icon={ClockIcon}
            />
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portefeuille */}
            <div className="lg:col-span-2 space-y-6">
              {/* Répartition du portefeuille */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Mon Portefeuille</h2>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Voir tout
                  </button>
                </div>
                
                <div className="space-y-4">
                  {portfolioData?.assets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{asset.symbol}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{asset.symbol}</h3>
                          <p className="text-gray-400 text-sm">{asset.amount} {asset.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${asset.value.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">{asset.allocation}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marché des cryptomonnaies */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Marché des Cryptomonnaies</h2>
                  <button 
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    onClick={() => setActiveTab('trading')}
                  >
                    <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                    Voir plus
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {marketData && Object.entries(marketData).map(([symbol, data]) => (
                    <CryptoCard
                      key={symbol}
                      symbol={symbol.toUpperCase()}
                      name={symbol === 'btc' ? 'Bitcoin' : symbol === 'eth' ? 'Ethereum' : symbol === 'bnb' ? 'Binance Coin' : 'Cardano'}
                      price={data.price}
                      change={data.change}
                      changePercent={data.changePercent}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar droite */}
            <div className="space-y-6">
              {/* Actions rapides */}
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-4">Actions Rapides</h3>
                <div className="space-y-3">
                  <button 
                    className="w-full btn-primary"
                    onClick={() => setActiveTab('trading')}
                  >
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    Acheter Crypto
                  </button>
                  <button className="w-full btn-secondary">
                    <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                    Vendre Crypto
                  </button>
                  <button 
                    className="w-full btn-secondary"
                    onClick={() => setActiveTab('trading')}
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Analyser Marché
                  </button>
                  <button className="w-full btn-secondary">
                    <EyeIcon className="h-5 w-5 mr-2" />
                    Watchlist
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  <BellIcon className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
                
                {notifications.length > 3 && (
                  <button className="w-full mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Voir toutes les notifications
                  </button>
                )}
              </div>

              {/* Statistiques du marché */}
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-4">Statistiques du Marché</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Cap. Marché Total</span>
                    <span className="text-white font-medium">$1.2T</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Volume 24h</span>
                    <span className="text-white font-medium">$45.2B</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Dominance BTC</span>
                    <span className="text-white font-medium">52.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Fear & Greed</span>
                    <span className="text-green-400 font-medium">Greed (75)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'portfolio' ? (
        /* Composant Portfolio */
        <div className="mt-6">
          <Portfolio />
        </div>
      ) : (
        /* Dashboard de Trading */
        <div className="mt-6">
          <TradingDashboard />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;