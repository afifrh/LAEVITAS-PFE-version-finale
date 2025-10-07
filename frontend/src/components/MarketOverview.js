import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  StarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import marketService from '../services/marketService';
import CandlestickChart from './charts/CandlestickChart';
import PriceChart from './charts/PriceChart';
import { useAuth } from '../contexts/AuthContext';
import { debugWebSocket } from '../utils/websocketDebug';
import './MarketOverview.css';

const MarketOverview = () => {
  const { isAuthenticated, status } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('volume');
  const [marketTypes, setMarketTypes] = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('price'); // 'price' ou 'candlestick'

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
    
    return () => {
      marketService.disconnect();
    };
  }, []);

  // Se connecter au WebSocket seulement quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && status === 'authenticated') {
      connectToWebSocket();
    }
    
    return () => {
      if (isAuthenticated) {
        marketService.disconnect();
      }
    };
  }, [isAuthenticated, status]);

  // Charger les données initiales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Charger les marchés, types et watchlists en parallèle
      const [marketsResponse, typesResponse, watchlistsResponse] = await Promise.all([
        marketService.getMarkets({ limit: 100, sort: sortBy }),
        marketService.getMarketTypes(),
        marketService.getWatchlists().catch(() => ({ data: [] })) // Ignorer l'erreur si non connecté
      ]);

      setMarkets(marketsResponse.data.markets);
      setMarketTypes(typesResponse.data);
      setWatchlists(watchlistsResponse.data || []);
      
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Se connecter au WebSocket
  const connectToWebSocket = async () => {
    try {
      console.log('🔌 Tentative de connexion WebSocket...');
      
      // Diagnostic préliminaire
      debugWebSocket();
      
      await marketService.connectWebSocket();
      setConnectionStatus('connected');
      console.log('✅ WebSocket connecté avec succès dans MarketOverview');
      
      // S'abonner aux mises à jour des marchés affichés
      markets.forEach(market => {
        marketService.subscribe(market.symbol, handleMarketUpdate);
      });
      
    } catch (err) {
      console.error('❌ Erreur de connexion WebSocket dans MarketOverview:', err);
      setConnectionStatus('disconnected');
      
      // Afficher des conseils de dépannage
      console.log('🔧 Conseils de dépannage:');
      console.log('1. Vérifiez que vous êtes connecté');
      console.log('2. Actualisez la page');
      console.log('3. Vérifiez que le serveur backend fonctionne');
      console.log('4. Ouvrez la console pour plus de détails');
    }
  };

  // Gérer les mises à jour de marché en temps réel
  const handleMarketUpdate = useCallback((symbol, data) => {
    setMarkets(prevMarkets => 
      prevMarkets.map(market => 
        market.symbol === symbol 
          ? { ...market, marketData: data }
          : market
      )
    );
  }, []);

  // Filtrer et trier les marchés
  useEffect(() => {
    let filtered = [...markets];

    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(market => 
        market.symbol.toLowerCase().includes(term) ||
        market.name?.toLowerCase().includes(term) ||
        market.baseAsset?.toLowerCase().includes(term) ||
        market.quoteAsset?.toLowerCase().includes(term)
      );
    }

    // Filtrer par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(market => market.type === selectedType);
    }

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return (b.marketData?.volume24h || 0) - (a.marketData?.volume24h || 0);
        case 'change':
          return (b.marketData?.changePercent24h || 0) - (a.marketData?.changePercent24h || 0);
        case 'alphabetical':
          return a.symbol.localeCompare(b.symbol);
        case 'price':
          return (b.marketData?.lastPrice || 0) - (a.marketData?.lastPrice || 0);
        default:
          return 0;
      }
    });

    setFilteredMarkets(filtered);
  }, [markets, searchTerm, selectedType, selectedCategory, sortBy]);

  // Vérifier si un marché est dans une watchlist
  const isInWatchlist = (symbol) => {
    return watchlists.some(watchlist => 
      watchlist.items?.some(item => item.symbol === symbol)
    );
  };

  // Afficher le graphique pour un marché
  const showMarketChart = (market, type = 'price') => {
    setSelectedMarket(market);
    setChartType(type);
    setShowChart(true);
  };

  // Fermer le graphique
  const closeChart = () => {
    setShowChart(false);
    setSelectedMarket(null);
  };

  // Ajouter/supprimer d'une watchlist
  const toggleWatchlist = async (symbol) => {
    try {
      if (watchlists.length === 0) {
        // Créer une watchlist par défaut
        const newWatchlist = await marketService.createWatchlist({
          name: 'Ma Watchlist',
          isDefault: true
        });
        setWatchlists([newWatchlist.data]);
        
        await marketService.addToWatchlist(newWatchlist.data._id, symbol);
      } else {
        const defaultWatchlist = watchlists.find(w => w.isDefault) || watchlists[0];
        
        if (isInWatchlist(symbol)) {
          await marketService.removeFromWatchlist(defaultWatchlist._id, symbol);
        } else {
          await marketService.addToWatchlist(defaultWatchlist._id, symbol);
        }
      }
      
      // Recharger les watchlists
      const watchlistsResponse = await marketService.getWatchlists();
      setWatchlists(watchlistsResponse.data);
      
    } catch (err) {
      console.error('Erreur lors de la gestion de la watchlist:', err);
    }
  };

  // Composant de ligne de marché
  const MarketRow = ({ market }) => {
    const { symbol, name, marketData, type } = market;
    const isWatched = isInWatchlist(symbol);
    const changePercent = marketData?.changePercent24h || 0;
    const isPositive = changePercent >= 0;

    return (
      <div className="market-row" key={symbol}>
        <div className="market-info">
          <button
            className={`watchlist-btn ${isWatched ? 'watched' : ''}`}
            onClick={() => toggleWatchlist(symbol)}
            title={isWatched ? 'Retirer de la watchlist' : 'Ajouter à la watchlist'}
          >
            {isWatched ? <StarIconSolid className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
          </button>
          
          <div className="market-details">
            <div className="market-symbol">
              <span className="symbol">{symbol}</span>
              <span className="type-badge">{type}</span>
            </div>
            {name && <div className="market-name">{name}</div>}
          </div>
        </div>

        <div className="market-price">
          <span className="price">
            {marketService.formatPrice(marketData?.lastPrice || 0)}
          </span>
          <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
            {Math.abs(changePercent).toFixed(2)}%
          </span>
        </div>

        <div className="market-volume">
          {marketService.formatVolume(marketData?.volume24h || 0)}
        </div>

        <div className="market-actions">
          <button 
            className="action-btn view-btn"
            title="Graphique de prix"
            onClick={() => showMarketChart(market, 'price')}
          >
            <span className="action-icon">👁️</span>
          </button>
          <button 
            className="action-btn trade-btn"
            title="Graphique en chandeliers"
            onClick={() => showMarketChart(market, 'candlestick')}
          >
            <span className="action-icon">📊</span>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="market-overview">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des marchés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-overview">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadInitialData} className="retry-btn">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="market-overview">
      {/* En-tête avec statut de connexion */}
      <div className="overview-header">
        <div className="header-left">
          <h2>📊 Aperçu des Marchés</h2>
          <div className="connection-status">
            <div className={`status-indicator ${connectionStatus}`}></div>
            <span>
              {connectionStatus === 'connected' ? 'Temps réel' : 'Hors ligne'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtres
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="search-filters">
        <div className="search-bar">
          <MagnifyingGlassIcon className="w-5 h-5 search-icon" />
          <input
            type="text"
            placeholder="Rechercher un marché..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Type:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous</option>
                {marketTypes.map(typeObj => (
                  <option key={typeObj.type} value={typeObj.type}>{typeObj.type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Catégorie:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes</option>
                <option value="major">Principales</option>
                <option value="altcoin">Altcoins</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Trier par:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="volume">Volume</option>
                <option value="change">Variation</option>
                <option value="alphabetical">Alphabétique</option>
                <option value="price">Prix</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Liste des marchés */}
      <div className="markets-container">
        <div className="markets-header">
          <div className="header-cell">Marché</div>
          <div className="header-cell">Prix</div>
          <div className="header-cell">Volume 24h</div>
          <div className="header-cell">Actions</div>
        </div>

        <div className="markets-list">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map(market => (
              <MarketRow key={market.symbol} market={market} />
            ))
          ) : (
            <div className="no-results">
              <p>Aucun marché trouvé</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="clear-search-btn"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="market-stats">
        <div className="stat-item">
          <span className="stat-label">Total des marchés:</span>
          <span className="stat-value">{markets.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Affichés:</span>
          <span className="stat-value">{filteredMarkets.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Dans watchlists:</span>
          <span className="stat-value">
            {Array.isArray(watchlists) ? watchlists.reduce((total, w) => total + (w.items?.length || 0), 0) : 0}
          </span>
        </div>
      </div>

      {/* Modal de graphique */}
      {showChart && selectedMarket && (
        <div className="chart-modal">
          <div className="chart-modal-content">
            <div className="chart-modal-header">
              <h3>📈 {selectedMarket.symbol} - {selectedMarket.name || 'Graphique'}</h3>
              <div className="chart-controls">
                <button
                  className={`chart-type-btn ${chartType === 'price' ? 'active' : ''}`}
                  onClick={() => setChartType('price')}
                >
                  Prix
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'candlestick' ? 'active' : ''}`}
                  onClick={() => setChartType('candlestick')}
                >
                  Chandeliers
                </button>
                <button className="close-btn" onClick={closeChart}>
                  ✕
                </button>
              </div>
            </div>
            <div className="chart-container">
              {chartType === 'price' ? (
                <PriceChart symbol={selectedMarket.symbol} />
              ) : (
                <CandlestickChart symbol={selectedMarket.symbol} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketOverview;