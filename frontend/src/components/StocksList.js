import React, { useState, useEffect } from 'react';
import TradingService from '../services/tradingService';
import './StocksList.css';

const StocksList = ({ stocks: initialStocks }) => {
  const [stocks, setStocks] = useState(initialStocks || []);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);

  // Charger les détails d'une action
  const loadStockDetails = async (symbol) => {
    try {
      setLoading(true);
      const data = await TradingService.getStockData(symbol);
      setStockDetails(data);
      setSelectedStock(symbol);
    } catch (error) {
      console.error(`Erreur lors du chargement de ${symbol}:`, error);
    } finally {
      setLoading(false);
    }
  };

  if (!stocks || stocks.length === 0) {
    return (
      <div className="stocks-list">
        <div className="stocks-empty">
          <div className="empty-icon">📈</div>
          <h3>Aucune donnée d'action disponible</h3>
          <p>Les données des actions seront affichées ici une fois chargées.</p>
          <div className="popular-stocks">
            <h4>Actions populaires à surveiller:</h4>
            <div className="stock-suggestions">
              {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'].map(symbol => (
                <button 
                  key={symbol}
                  className="stock-suggestion"
                  onClick={() => loadStockDetails(symbol)}
                  disabled={loading}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stocks-list">
      <div className="stocks-header">
        <h3>📊 Actions Populaires</h3>
        <div className="stocks-info">
          <span className="info-badge">
            📅 Données quotidiennes • 🕐 Marché US
          </span>
        </div>
      </div>

      <div className="stocks-grid">
        {stocks.map((stock) => {
          if (stock.error) {
            return (
              <div key={stock.symbol} className="stock-card error">
                <div className="stock-header">
                  <h4>{stock.symbol}</h4>
                  <span className="error-badge">❌ Erreur</span>
                </div>
                <p className="error-message">{stock.error}</p>
                <button 
                  className="retry-button"
                  onClick={() => loadStockDetails(stock.symbol)}
                  disabled={loading}
                >
                  Réessayer
                </button>
              </div>
            );
          }

          const data = stock.data;
          if (!data) return null;

          const change = data.close - data.open;
          const changePercent = ((change / data.open) * 100);

          return (
            <div 
              key={stock.symbol} 
              className="stock-card"
              onClick={() => loadStockDetails(stock.symbol)}
            >
              <div className="stock-header">
                <h4 className="stock-symbol">{stock.symbol}</h4>
                <span className="stock-date">{new Date(data.date).toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="stock-price">
                <span className="current-price">
                  {TradingService.formatCurrency(data.close)}
                </span>
                <div className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-amount">
                    {change >= 0 ? '+' : ''}{TradingService.formatCurrency(change)}
                  </span>
                  <span className="change-percent">
                    ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="stock-details">
                <div className="detail-row">
                  <span className="detail-label">Ouverture:</span>
                  <span className="detail-value">{TradingService.formatCurrency(data.open)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plus haut:</span>
                  <span className="detail-value">{TradingService.formatCurrency(data.high)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plus bas:</span>
                  <span className="detail-value">{TradingService.formatCurrency(data.low)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Volume:</span>
                  <span className="detail-value">{TradingService.formatLargeNumber(data.volume)}</span>
                </div>
              </div>

              <div className="stock-actions">
                <button className="view-details-btn">
                  📊 Voir détails
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal pour les détails d'une action */}
      {selectedStock && stockDetails && (
        <div className="stock-modal-overlay" onClick={() => setSelectedStock(null)}>
          <div className="stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📈 {selectedStock} - Analyse Détaillée</h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedStock(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {loading ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Chargement des données détaillées...</p>
                </div>
              ) : (
                <div className="stock-analysis">
                  {/* Données de base */}
                  <div className="analysis-section">
                    <h4>💰 Données de Prix</h4>
                    <div className="price-grid">
                      {stockDetails.stockData && Object.entries(stockDetails.stockData).map(([key, value]) => {
                        if (key.includes('Time Series')) {
                          const latestDate = Object.keys(value)[0];
                          const latestData = value[latestDate];
                          return (
                            <div key={key} className="price-info">
                              <h5>Dernière séance ({latestDate})</h5>
                              <div className="ohlcv">
                                <div>Ouverture: {TradingService.formatCurrency(parseFloat(latestData['1. open']))}</div>
                                <div>Plus haut: {TradingService.formatCurrency(parseFloat(latestData['2. high']))}</div>
                                <div>Plus bas: {TradingService.formatCurrency(parseFloat(latestData['3. low']))}</div>
                                <div>Clôture: {TradingService.formatCurrency(parseFloat(latestData['4. close']))}</div>
                                <div>Volume: {TradingService.formatLargeNumber(parseInt(latestData['5. volume']))}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>

                  {/* Indicateurs techniques */}
                  <div className="analysis-section">
                    <h4>📊 Indicateurs Techniques</h4>
                    <div className="indicators-grid">
                      {stockDetails.technicalIndicators.rsi && (
                        <div className="indicator-card">
                          <h5>RSI (14)</h5>
                          <p>Indice de Force Relative</p>
                          <div className="indicator-status">
                            ✅ Données disponibles
                          </div>
                        </div>
                      )}
                      
                      {stockDetails.technicalIndicators.macd && (
                        <div className="indicator-card">
                          <h5>MACD</h5>
                          <p>Convergence/Divergence des Moyennes Mobiles</p>
                          <div className="indicator-status">
                            ✅ Données disponibles
                          </div>
                        </div>
                      )}
                      
                      {stockDetails.technicalIndicators.bollinger && (
                        <div className="indicator-card">
                          <h5>Bollinger Bands</h5>
                          <p>Bandes de Bollinger (20, 2)</p>
                          <div className="indicator-status">
                            ✅ Données disponibles
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section d'aide */}
      <div className="stocks-help">
        <h4>💡 Comment utiliser cette section</h4>
        <div className="help-items">
          <div className="help-item">
            <span className="help-icon">📊</span>
            <span>Cliquez sur une action pour voir l'analyse détaillée</span>
          </div>
          <div className="help-item">
            <span className="help-icon">🔄</span>
            <span>Les données sont mises à jour quotidiennement</span>
          </div>
          <div className="help-item">
            <span className="help-icon">📈</span>
            <span>Les couleurs indiquent la performance (vert = hausse, rouge = baisse)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StocksList;