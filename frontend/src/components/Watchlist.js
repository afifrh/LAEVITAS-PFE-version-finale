import React, { useState, useEffect, useRef } from 'react';
import { 
  StarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  BellIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import marketService from '../services/marketService';
import { useNavigate } from 'react-router-dom';
import './Watchlist.css';
import PriceChart from './charts/PriceChart';
import CandlestickChart from './charts/CandlestickChart';

  const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartType, setChartType] = useState('price');
  const [chartSymbol, setChartSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [newWatchlist, setNewWatchlist] = useState({ name: '', description: '', isDefault: false });
  const [editingWatchlist, setEditingWatchlist] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const unsubscribeRefs = useRef([]);

  useEffect(() => {
    loadWatchlists();
    loadAvailableMarkets();
  }, []);

  // Connexion WebSocket au montage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await marketService.connectWebSocket();
        if (isMounted) setWsConnected(true);
        // Si une watchlist est déjà sélectionnée, réabonner
      } catch (err) {
        console.error('Erreur de connexion WebSocket dans Watchlist:', err);
        if (isMounted) setWsConnected(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Abonnement aux symboles de la watchlist sélectionnée
  useEffect(() => {
    // Nettoyer les abonnements précédents
    if (unsubscribeRefs.current.length > 0) {
      try {
        unsubscribeRefs.current.forEach((unsub) => {
          try { unsub(); } catch (_) {}
        });
      } finally {
        unsubscribeRefs.current = [];
      }
    }

    if (!wsConnected || !selectedWatchlist || !Array.isArray(selectedWatchlist.items) || selectedWatchlist.items.length === 0) {
      return;
    }

    // S'abonner à chaque symbole de la watchlist
    const newUnsubs = selectedWatchlist.items.map((item) => {
      const symbol = item.symbol;
      const unsubscribe = marketService.subscribe(symbol, (data) => {
        // Mettre à jour l'élément correspondant avec les données temps réel
        setSelectedWatchlist((prev) => {
          if (!prev) return prev;
          const updatedItems = (prev.items || []).map((it) =>
            it.symbol === symbol ? { ...it, marketData: data } : it
          );
          return { ...prev, items: updatedItems };
        });
      });
      return unsubscribe;
    });

    unsubscribeRefs.current = newUnsubs;

    // Nettoyage si la watchlist change ou au démontage
    return () => {
      if (unsubscribeRefs.current.length > 0) {
        unsubscribeRefs.current.forEach((unsub) => {
          try { unsub(); } catch (_) {}
        });
        unsubscribeRefs.current = [];
      }
    };
  }, [wsConnected, selectedWatchlist]);

  const loadWatchlists = async () => {
    try {
      setLoading(true);
      const response = await marketService.getWatchlists();
      setWatchlists(response.data);

      // Mettre à jour la sélection pour éviter les données obsolètes
      if (response.data.length > 0) {
        if (selectedWatchlist?._id) {
          const updatedSelected = response.data.find(w => w._id === selectedWatchlist._id);
          if (updatedSelected) {
            setSelectedWatchlist(updatedSelected);
          } else if (!selectedWatchlist) {
            const defaultWatchlist = response.data.find(w => w.isDefault) || response.data[0];
            setSelectedWatchlist(defaultWatchlist);
          }
        } else if (!selectedWatchlist) {
          const defaultWatchlist = response.data.find(w => w.isDefault) || response.data[0];
          setSelectedWatchlist(defaultWatchlist);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des watchlists');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMarkets = async () => {
    try {
      const response = await marketService.getMarkets({ limit: 100 });
      setAvailableMarkets(response.data.markets);
    } catch (err) {
      console.error('Erreur lors du chargement des marchés:', err);
    }
  };

  const createWatchlist = async () => {
    try {
      const response = await marketService.createWatchlist(newWatchlist);
      setWatchlists([...watchlists, response.data]);
      setNewWatchlist({ name: '', description: '', isDefault: false });
      setShowCreateModal(false);
      
      if (watchlists.length === 0) {
        setSelectedWatchlist(response.data);
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    }
  };

  const updateWatchlist = async () => {
    try {
      const response = await marketService.updateWatchlist(editingWatchlist._id, {
        name: editingWatchlist.name,
        description: editingWatchlist.description,
        isDefault: editingWatchlist.isDefault
      });
      
      setWatchlists(watchlists.map(w => 
        w._id === editingWatchlist._id ? response.data : w
      ));
      
      if (selectedWatchlist?._id === editingWatchlist._id) {
        setSelectedWatchlist(response.data);
      }
      
      setShowEditModal(false);
      setEditingWatchlist(null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const deleteWatchlist = async (watchlistId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette watchlist ?')) {
      return;
    }

    try {
      await marketService.deleteWatchlist(watchlistId);
      const updatedWatchlists = watchlists.filter(w => w._id !== watchlistId);
      setWatchlists(updatedWatchlists);
      
      if (selectedWatchlist?._id === watchlistId) {
        setSelectedWatchlist(updatedWatchlists[0] || null);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const addToWatchlist = async (symbol) => {
    if (!selectedWatchlist) return;

    try {
      await marketService.addToWatchlist(selectedWatchlist._id, symbol);
      await loadWatchlists(); // Recharger pour avoir les données à jour
      setShowAddItemModal(false);
      setSearchTerm('');
    } catch (err) {
      console.error('Erreur lors de l\'ajout:', err);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    if (!selectedWatchlist) return;

    try {
      await marketService.removeFromWatchlist(selectedWatchlist._id, symbol);
      await loadWatchlists(); // Recharger pour avoir les données à jour
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const toggleAlert = async (symbol) => {
    if (!selectedWatchlist) return;

    try {
      const item = selectedWatchlist.items.find(i => i.symbol === symbol);
      const currentPrice = item?.marketData?.lastPrice || 0;

      if (item?.alertEnabled) {
        // Désactiver toutes les alertes (ou supprimer)
        await marketService.toggleAlert(selectedWatchlist._id, symbol, false);
      } else {
        // Créer une alerte simple au-dessus de 5%
        const threshold = currentPrice ? currentPrice * 1.05 : 100;
        await marketService.addAlert(selectedWatchlist._id, symbol, {
          type: 'price_above',
          value: Number(threshold.toFixed(2))
        });
      }

      await loadWatchlists();
    } catch (err) {
      console.error('Erreur lors de la gestion de l\'alerte:', err);
    }
  };

  const filteredMarkets = availableMarkets.filter(market => {
    const term = searchTerm.toLowerCase();
    return market.symbol.toLowerCase().includes(term) ||
           market.name?.toLowerCase().includes(term);
  });

  const WatchlistItem = ({ item }) => {
    const { symbol, marketData, alertEnabled } = item;
    const changePercent = marketData?.changePercent24h || 0;
    const isPositive = changePercent >= 0;

    return (
      <div className="watchlist-item">
        <div className="item-info">
          <div className="item-symbol">
            <span className="symbol">{symbol}</span>
            {alertEnabled && <BellIconSolid className="w-4 h-4 alert-active" />}
          </div>
          <div className="item-price">
            <span className="price">
              {marketService.formatPrice(marketData?.lastPrice || 0)}
            </span>
            <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
              {Math.abs(changePercent).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="item-volume">
          {marketService.formatVolume(marketData?.volume24h || 0)}
        </div>

        <div className="item-actions">
          <button
            className={`action-btn alert-btn ${alertEnabled ? 'active' : ''}`}
            onClick={() => toggleAlert(symbol)}
            title={alertEnabled ? 'Désactiver l\'alerte' : 'Activer l\'alerte'}
          >
            {alertEnabled ? <BellIconSolid className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
          </button>
          
          <button 
            className="action-btn view-btn"
            title="Voir les détails"
            onClick={() => { setChartSymbol(symbol); setShowChartModal(true); }}
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          
          <button 
            className="action-btn trade-btn"
            title="Trader"
            onClick={() => navigate(`/trading?symbol=${encodeURIComponent(symbol)}`)}
          >
            <ChartBarIcon className="w-4 h-4" />
          </button>
          
          <button
            className="action-btn remove-btn"
            onClick={() => removeFromWatchlist(symbol)}
            title="Retirer de la watchlist"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="watchlist-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des watchlists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watchlist-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadWatchlists} className="retry-btn">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      {/* En-tête */}
      <div className="watchlist-header">
        <h2>⭐ Mes Watchlists</h2>
        <button
          className="create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="w-5 h-5" />
          Nouvelle Watchlist
        </button>
      </div>

      <div className="watchlist-content">
        {/* Sidebar avec liste des watchlists */}
        <div className="watchlist-sidebar">
          <div className="watchlist-list">
            {watchlists.map(watchlist => (
              <div
                key={watchlist._id}
                className={`watchlist-card ${selectedWatchlist?._id === watchlist._id ? 'active' : ''}`}
                onClick={() => setSelectedWatchlist(watchlist)}
              >
                <div className="watchlist-info">
                  <div className="watchlist-name">
                    {watchlist.name}
                    {watchlist.isDefault && <StarIconSolid className="w-4 h-4 default-star" />}
                  </div>
                  <div className="watchlist-stats">
                    {watchlist.items?.length || 0} éléments
                  </div>
                </div>
                
                <div className="watchlist-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingWatchlist(watchlist);
                      setShowEditModal(true);
                    }}
                    title="Modifier"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  
                  {!watchlist.isDefault && (
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWatchlist(watchlist._id);
                      }}
                      title="Supprimer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="watchlist-main">
          {selectedWatchlist ? (
            <>
              <div className="watchlist-main-header">
                <div className="header-info">
                  <h3>{selectedWatchlist.name}</h3>
                  {selectedWatchlist.description && (
                    <p className="description">{selectedWatchlist.description}</p>
                  )}
                </div>
                
                <button
                  className="add-item-btn"
                  onClick={() => setShowAddItemModal(true)}
                >
                  <PlusIcon className="w-5 h-5" />
                  Ajouter un marché
                </button>
              </div>

              <div className="watchlist-items">
                {selectedWatchlist.items && selectedWatchlist.items.length > 0 ? (
                  <>
                    <div className="items-header">
                      <div className="header-cell">Marché</div>
                      <div className="header-cell">Volume 24h</div>
                      <div className="header-cell">Actions</div>
                    </div>
                    
                    <div className="items-list">
                      {selectedWatchlist.items.map(item => (
                        <WatchlistItem key={item.symbol} item={item} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-watchlist">
                    <StarIcon className="w-16 h-16 empty-icon" />
                    <h4>Watchlist vide</h4>
                    <p>Ajoutez des marchés à suivre pour commencer</p>
                    <button
                      className="add-first-btn"
                      onClick={() => setShowAddItemModal(true)}
                    >
                      Ajouter un marché
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-watchlist">
              <StarIcon className="w-16 h-16 empty-icon" />
              <h4>Aucune watchlist sélectionnée</h4>
              <p>Créez ou sélectionnez une watchlist pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Créer une nouvelle watchlist</h3>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={newWatchlist.name}
                  onChange={(e) => setNewWatchlist({...newWatchlist, name: e.target.value})}
                  placeholder="Ma watchlist"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newWatchlist.description}
                  onChange={(e) => setNewWatchlist({...newWatchlist, description: e.target.value})}
                  placeholder="Description optionnelle"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newWatchlist.isDefault}
                    onChange={(e) => setNewWatchlist({...newWatchlist, isDefault: e.target.checked})}
                  />
                  Définir comme watchlist par défaut
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </button>
              <button
                className="create-btn"
                onClick={createWatchlist}
                disabled={!newWatchlist.name.trim()}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingWatchlist && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier la watchlist</h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={editingWatchlist.name}
                  onChange={(e) => setEditingWatchlist({...editingWatchlist, name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingWatchlist.description || ''}
                  onChange={(e) => setEditingWatchlist({...editingWatchlist, description: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingWatchlist.isDefault}
                    onChange={(e) => setEditingWatchlist({...editingWatchlist, isDefault: e.target.checked})}
                  />
                  Définir comme watchlist par défaut
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowEditModal(false)}
              >
                Annuler
              </button>
              <button
                className="save-btn"
                onClick={updateWatchlist}
                disabled={!editingWatchlist.name.trim()}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'élément */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter un marché</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddItemModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
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
              
              <div className="markets-list">
                {filteredMarkets.map(market => {
                  const isAlreadyAdded = selectedWatchlist?.items?.some(item => item.symbol === market.symbol);
                  
                  return (
                    <div key={market.symbol} className="market-option">
                      <div className="market-info">
                        <span className="symbol">{market.symbol}</span>
                        {market.name && <span className="name">{market.name}</span>}
                      </div>
                      
                      <button
                        className={`add-btn ${isAlreadyAdded ? 'disabled' : ''}`}
                        onClick={() => !isAlreadyAdded && addToWatchlist(market.symbol)}
                        disabled={isAlreadyAdded}
                      >
                        {isAlreadyAdded ? 'Déjà ajouté' : 'Ajouter'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de graphique */}
      {showChartModal && chartSymbol && (
        <div className="modal-overlay" onClick={() => setShowChartModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📈 {chartSymbol} - Graphique</h3>
              <button className="close-btn" onClick={() => setShowChartModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  className={`chart-type-btn ${chartType === 'price' ? 'active' : ''}`}
                  onClick={() => setChartType('price')}
                >Prix</button>
                <button
                  className={`chart-type-btn ${chartType === 'candlestick' ? 'active' : ''}`}
                  onClick={() => setChartType('candlestick')}
                >Chandeliers</button>
              </div>
              <div className="chart-container">
                {chartType === 'price' ? (
                  <PriceChart symbol={chartSymbol} />
                ) : (
                  <CandlestickChart symbol={chartSymbol} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;