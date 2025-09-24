import React from 'react';
import TradingService from '../services/tradingService';
import './TrendingCoins.css';

const TrendingCoins = ({ trending }) => {
  if (!trending || trending.length === 0) {
    return (
      <div className="trending-coins">
        <div className="trending-empty">
          <p>Aucune donnée de tendance disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-coins">
      <div className="trending-list">
        {trending.slice(0, 7).map((item, index) => {
          const coin = item.item;
          return (
            <div key={coin.id} className="trending-item">
              <div className="trending-rank">
                <span className="rank-number">#{index + 1}</span>
                <span className="trending-icon">🔥</span>
              </div>
              
              <div className="trending-info">
                <div className="coin-header">
                  <img 
                    src={coin.large || coin.thumb} 
                    alt={coin.name}
                    className="trending-logo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="coin-names">
                    <h4 className="coin-name">{coin.name}</h4>
                    <span className="coin-symbol">{coin.symbol}</span>
                  </div>
                </div>

                <div className="coin-stats">
                  <div className="stat">
                    <span className="stat-label">Rang Market Cap:</span>
                    <span className="stat-value">#{coin.market_cap_rank || 'N/A'}</span>
                  </div>
                  
                  {coin.price_btc && (
                    <div className="stat">
                      <span className="stat-label">Prix en BTC:</span>
                      <span className="stat-value">
                        {parseFloat(coin.price_btc).toFixed(8)} ₿
                      </span>
                    </div>
                  )}

                  <div className="stat">
                    <span className="stat-label">Score:</span>
                    <span className="stat-value trending-score">
                      {coin.score + 1}/7
                    </span>
                  </div>
                </div>

                {/* Indicateur de tendance */}
                <div className="trending-indicator">
                  <div className="trend-bar">
                    <div 
                      className="trend-fill"
                      style={{ 
                        width: `${((coin.score + 1) / 7) * 100}%`,
                        backgroundColor: getTrendColor(coin.score + 1)
                      }}
                    ></div>
                  </div>
                  <span className="trend-label">
                    {getTrendLabel(coin.score + 1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="trending-legend">
        <h4>📊 Comment lire les tendances</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color hot"></span>
            <span>Très tendance (6-7/7)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color warm"></span>
            <span>Tendance (4-5/7)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color cool"></span>
            <span>Émergent (1-3/7)</span>
          </div>
        </div>
        <p className="legend-note">
          💡 Le score de tendance est basé sur l'activité de recherche et les mentions sur les réseaux sociaux.
        </p>
      </div>
    </div>
  );
};

// Fonction pour obtenir la couleur selon le score de tendance
const getTrendColor = (score) => {
  if (score >= 6) return '#ef4444'; // Rouge chaud
  if (score >= 4) return '#f59e0b'; // Orange
  return '#10b981'; // Vert cool
};

// Fonction pour obtenir le label de tendance
const getTrendLabel = (score) => {
  if (score >= 6) return '🔥 Très chaud';
  if (score >= 4) return '🌡️ Chaud';
  return '📈 Émergent';
};

export default TrendingCoins;