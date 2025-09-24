import React, { useState, useEffect } from 'react';
import TradingService from '../services/tradingService';
import CryptoTable from './CryptoTable';
import MarketOverview from './MarketOverview';
import TrendingCoins from './TrendingCoins';
import StocksList from './StocksList';
import ForexPairs from './ForexPairs';
import SearchAssets from './SearchAssets';
import './TradingDashboard.css';

const TradingDashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données du marché
  const loadMarketData = async () => {
    try {
      setError(null);
      const data = await TradingService.getMarketOverview();
      setMarketData(data);
    } catch (err) {
      setError('Erreur lors du chargement des données du marché');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
  };

  useEffect(() => {
    loadMarketData();
    
    // Rafraîchir automatiquement toutes les 5 minutes
    const interval = setInterval(loadMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="trading-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données du marché...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={loadMarketData} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📈 Dashboard de Trading</h1>
          <div className="header-actions">
            <button 
              onClick={handleRefresh} 
              className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
              disabled={refreshing}
            >
              🔄 {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Aperçu
          </button>
          <button 
            className={`tab ${activeTab === 'crypto' ? 'active' : ''}`}
            onClick={() => setActiveTab('crypto')}
          >
            ₿ Cryptomonnaies
          </button>
          <button 
            className={`tab ${activeTab === 'stocks' ? 'active' : ''}`}
            onClick={() => setActiveTab('stocks')}
          >
            📈 Actions
          </button>
          <button 
            className={`tab ${activeTab === 'forex' ? 'active' : ''}`}
            onClick={() => setActiveTab('forex')}
          >
            💱 Forex
          </button>
          <button 
            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Recherche
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <MarketOverview data={marketData} />
            <div className="overview-grid">
              <div className="overview-section">
                <h3>🔥 Cryptos Tendance</h3>
                <TrendingCoins trending={marketData?.trending || []} />
              </div>
              <div className="overview-section">
                <h3>💰 Top Cryptomonnaies</h3>
                <CryptoTable 
                  cryptos={marketData?.crypto?.topCoins?.slice(0, 5) || []} 
                  compact={true}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="crypto-tab">
            <div className="tab-header">
              <h2>💰 Marché des Cryptomonnaies</h2>
              <div className="market-stats">
                {marketData?.crypto?.globalData && (
                  <>
                    <div className="stat">
                      <span className="stat-label">Market Cap Total:</span>
                      <span className="stat-value">
                        {TradingService.formatLargeNumber(marketData.crypto.globalData.total_market_cap?.usd)}$
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Volume 24h:</span>
                      <span className="stat-value">
                        {TradingService.formatLargeNumber(marketData.crypto.globalData.total_volume?.usd)}$
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Dominance BTC:</span>
                      <span className="stat-value">
                        {marketData.crypto.globalData.market_cap_percentage?.btc?.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <CryptoTable cryptos={marketData?.crypto?.topCoins || []} />
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="stocks-tab">
            <h2>📈 Actions Populaires</h2>
            <StocksList stocks={marketData?.stocks || []} />
          </div>
        )}

        {activeTab === 'forex' && (
          <div className="forex-tab">
            <h2>💱 Paires de Devises</h2>
            <ForexPairs />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="search-tab">
            <h2>🔍 Rechercher des Actifs</h2>
            <SearchAssets />
          </div>
        )}
      </div>

      {/* Footer avec informations */}
      <div className="dashboard-footer">
        <div className="footer-info">
          <p>
            📡 Données fournies par CoinGecko et Alpha Vantage • 
            🔄 Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')} •
            ⚡ Actualisation automatique toutes les 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;