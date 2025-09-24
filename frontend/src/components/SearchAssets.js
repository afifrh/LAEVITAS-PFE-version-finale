import React, { useState, useEffect, useRef } from 'react';
import TradingService from '../services/tradingService';
import './SearchAssets.css';

const SearchAssets = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cryptocurrencies: [], stocks: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDetails, setAssetDetails] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Charger l'historique de recherche depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tradingSearchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur lors du chargement de l\'historique:', e);
      }
    }
  }, []);

  // Sauvegarder l'historique de recherche
  const saveToHistory = (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm)
    ].slice(0, 10); // Garder seulement les 10 dernières recherches
    
    setSearchHistory(newHistory);
    localStorage.setItem('tradingSearchHistory', JSON.stringify(newHistory));
  };

  // Effectuer la recherche
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ cryptocurrencies: [], stocks: [] });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await TradingService.searchAssets(searchQuery);
      
      // S'assurer que les propriétés existent toujours
      const safeResults = {
        cryptocurrencies: searchResults?.cryptocurrencies || [],
        stocks: searchResults?.stocks || []
      };
      
      setResults(safeResults);
      saveToHistory(searchQuery);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error('Erreur de recherche:', err);
      // En cas d'erreur, réinitialiser avec une structure sûre
      setResults({ cryptocurrencies: [], stocks: [] });
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de texte de recherche avec debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Annuler la recherche précédente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Programmer une nouvelle recherche après 500ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  // Charger les détails d'un actif
  const loadAssetDetails = async (asset, type) => {
    try {
      setLoading(true);
      setSelectedAsset({ ...asset, type });
      
      if (type === 'crypto') {
        const details = await TradingService.getCryptoDetails(asset.id);
        setAssetDetails(details);
      } else if (type === 'stock') {
        const details = await TradingService.getStockData(asset['1. symbol']);
        setAssetDetails(details);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  // Suggestions populaires
  const popularSuggestions = {
    crypto: ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'],
    stocks: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
  };

  return (
    <div className="search-assets">
      {/* Barre de recherche */}
      <div className="search-container">
        <div className="search-input-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            placeholder="Rechercher des cryptomonnaies ou des actions..."
            value={query}
            onChange={handleSearchChange}
            className="search-input"
          />
          {loading && <div className="search-loading">⏳</div>}
          {query && (
            <button 
              className="clear-search"
              onClick={() => {
                setQuery('');
                setResults({ cryptocurrencies: [], stocks: [] });
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Historique de recherche */}
        {searchHistory.length > 0 && !query && (
          <div className="search-history">
            <h4>🕒 Recherches récentes</h4>
            <div className="history-tags">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  className="history-tag"
                  onClick={() => {
                    setQuery(term);
                    performSearch(term);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions populaires */}
        {!query && (
          <div className="popular-suggestions">
            <div className="suggestions-section">
              <h4>🔥 Cryptomonnaies populaires</h4>
              <div className="suggestion-tags">
                {popularSuggestions.crypto.map(suggestion => (
                  <button
                    key={suggestion}
                    className="suggestion-tag crypto"
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="suggestions-section">
              <h4>📈 Actions populaires</h4>
              <div className="suggestion-tags">
                {popularSuggestions.stocks.map(suggestion => (
                  <button
                    key={suggestion}
                    className="suggestion-tag stock"
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      {query && (
        <div className="search-results">
          {error && (
            <div className="search-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Résultats cryptomonnaies */}
              {results.cryptocurrencies && results.cryptocurrencies.length > 0 && (
                <div className="results-section">
                  <h3>💰 Cryptomonnaies ({results.cryptocurrencies.length})</h3>
                  <div className="results-grid">
                    {results.cryptocurrencies.slice(0, 10).map(crypto => (
                      <div 
                        key={crypto.id} 
                        className="result-card crypto"
                        onClick={() => loadAssetDetails(crypto, 'crypto')}
                      >
                        <div className="result-header">
                          <img 
                            src={crypto.large || crypto.thumb} 
                            alt={crypto.name}
                            className="result-logo"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <div className="result-info">
                            <h4>{crypto.name}</h4>
                            <span className="result-symbol">{crypto.symbol}</span>
                          </div>
                        </div>
                        <div className="result-details">
                          <div className="detail">
                            <span>Rang:</span>
                            <span>#{crypto.market_cap_rank || 'N/A'}</span>
                          </div>
                        </div>
                        <button className="view-details">
                          Voir détails →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultats actions */}
              {results.stocks && results.stocks.length > 0 && (
                <div className="results-section">
                  <h3>📈 Actions ({results.stocks.length})</h3>
                  <div className="results-grid">
                    {results.stocks.slice(0, 10).map((stock, index) => (
                      <div 
                        key={index} 
                        className="result-card stock"
                        onClick={() => loadAssetDetails(stock, 'stock')}
                      >
                        <div className="result-header">
                          <div className="stock-icon">📊</div>
                          <div className="result-info">
                            <h4>{stock['2. name']}</h4>
                            <span className="result-symbol">{stock['1. symbol']}</span>
                          </div>
                        </div>
                        <div className="result-details">
                          <div className="detail">
                            <span>Type:</span>
                            <span>{stock['3. type']}</span>
                          </div>
                          <div className="detail">
                            <span>Région:</span>
                            <span>{stock['4. region']}</span>
                          </div>
                        </div>
                        <button className="view-details">
                          Voir détails →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aucun résultat */}
              {results.cryptocurrencies.length === 0 && results.stocks.length === 0 && query && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>Aucun résultat trouvé</h3>
                  <p>Essayez avec d'autres termes de recherche</p>
                  <div className="search-tips">
                    <h4>💡 Conseils de recherche:</h4>
                    <ul>
                      <li>Utilisez le nom complet ou le symbole</li>
                      <li>Essayez "BTC" au lieu de "Bitcoin"</li>
                      <li>Vérifiez l'orthographe</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal pour les détails d'un actif */}
      {selectedAsset && assetDetails && (
        <div className="asset-modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="asset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedAsset.type === 'crypto' ? '💰' : '📈'} 
                {selectedAsset.name || selectedAsset['2. name']} - Détails
              </h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedAsset(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {loading ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Chargement des détails...</p>
                </div>
              ) : (
                <div className="asset-details">
                  {selectedAsset.type === 'crypto' ? (
                    <CryptoDetails details={assetDetails} />
                  ) : (
                    <StockDetails details={assetDetails} symbol={selectedAsset['1. symbol']} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour les détails d'une crypto
const CryptoDetails = ({ details }) => {
  const { details: info, priceHistory } = details;
  
  return (
    <div className="crypto-details">
      <div className="details-header">
        <img src={info.image?.large} alt={info.name} className="details-logo" />
        <div>
          <h4>{info.name} ({info.symbol?.toUpperCase()})</h4>
          <p>{info.description?.en?.substring(0, 200)}...</p>
        </div>
      </div>

      <div className="details-stats">
        <div className="stat">
          <span>Prix actuel:</span>
          <span>{TradingService.formatCurrency(info.market_data?.current_price?.usd)}</span>
        </div>
        <div className="stat">
          <span>Market Cap:</span>
          <span>{TradingService.formatLargeNumber(info.market_data?.market_cap?.usd)}$</span>
        </div>
        <div className="stat">
          <span>Volume 24h:</span>
          <span>{TradingService.formatLargeNumber(info.market_data?.total_volume?.usd)}$</span>
        </div>
        <div className="stat">
          <span>Rang:</span>
          <span>#{info.market_cap_rank}</span>
        </div>
      </div>
    </div>
  );
};

// Composant pour les détails d'une action
const StockDetails = ({ details, symbol }) => {
  return (
    <div className="stock-details">
      <div className="details-header">
        <div className="stock-icon-large">📊</div>
        <div>
          <h4>{symbol}</h4>
          <p>Données de l'action et indicateurs techniques</p>
        </div>
      </div>

      <div className="details-stats">
        <div className="stat">
          <span>Symbole:</span>
          <span>{symbol}</span>
        </div>
        <div className="stat">
          <span>Données disponibles:</span>
          <span>{details.stockData ? '✅ Oui' : '❌ Non'}</span>
        </div>
        <div className="stat">
          <span>Indicateurs techniques:</span>
          <span>
            {Object.values(details.technicalIndicators).filter(Boolean).length}/3
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchAssets;