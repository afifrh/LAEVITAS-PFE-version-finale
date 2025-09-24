import React, { useState, useEffect } from 'react';
import TradingService from '../services/tradingService';
import './ForexPairs.css';

const ForexPairs = () => {
  const [forexData, setForexData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);

  // Charger les données forex
  const loadForexData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TradingService.getForexData();
      setForexData(data);
    } catch (err) {
      setError('Erreur lors du chargement des données forex');
      console.error('Erreur forex:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForexData();
  }, []);

  if (loading) {
    return (
      <div className="forex-pairs">
        <div className="forex-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des données forex...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forex-pairs">
        <div className="forex-error">
          <div className="error-icon">⚠️</div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={loadForexData} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forex-pairs">
      <div className="forex-header">
        <h3>💱 Paires de Devises Majeures</h3>
        <div className="forex-info">
          <span className="info-badge">
            📅 Données quotidiennes • 🌍 Marché Forex
          </span>
        </div>
      </div>

      <div className="forex-grid">
        {forexData.map((pairData, index) => {
          if (pairData.error) {
            return (
              <div key={pairData.pair} className="forex-card error">
                <div className="pair-header">
                  <h4>{pairData.pair}</h4>
                  <span className="error-badge">❌ Erreur</span>
                </div>
                <p className="error-message">{pairData.error}</p>
                <div className="error-note">
                  <small>⚠️ Limite d'API atteinte ou données indisponibles</small>
                </div>
              </div>
            );
          }

          const data = pairData.data;
          if (!data || data.length === 0) {
            return (
              <div key={pairData.pair} className="forex-card no-data">
                <div className="pair-header">
                  <h4>{pairData.pair}</h4>
                  <span className="no-data-badge">📊 Pas de données</span>
                </div>
                <p>Données non disponibles pour cette paire</p>
              </div>
            );
          }

          // Prendre les deux derniers jours pour calculer le changement
          const latest = data[data.length - 1];
          const previous = data[data.length - 2];
          
          const change = previous ? latest.close - previous.close : 0;
          const changePercent = previous ? ((change / previous.close) * 100) : 0;

          return (
            <div 
              key={pairData.pair} 
              className="forex-card"
              onClick={() => setSelectedPair(pairData)}
            >
              <div className="pair-header">
                <h4 className="pair-name">{pairData.pair}</h4>
                <span className="pair-date">
                  {new Date(latest.date).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="pair-price">
                <span className="current-rate">
                  {latest.close.toFixed(5)}
                </span>
                <div className={`rate-change ${change >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-amount">
                    {change >= 0 ? '+' : ''}{change.toFixed(5)}
                  </span>
                  <span className="change-percent">
                    ({change >= 0 ? '+' : ''}{changePercent.toFixed(3)}%)
                  </span>
                </div>
              </div>

              <div className="pair-details">
                <div className="detail-row">
                  <span className="detail-label">Ouverture:</span>
                  <span className="detail-value">{latest.open.toFixed(5)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plus haut:</span>
                  <span className="detail-value">{latest.high.toFixed(5)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plus bas:</span>
                  <span className="detail-value">{latest.low.toFixed(5)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Volatilité:</span>
                  <span className="detail-value">
                    {(((latest.high - latest.low) / latest.open) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="pair-actions">
                <button className="view-chart-btn">
                  📊 Voir graphique
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal pour les détails d'une paire */}
      {selectedPair && (
        <div className="forex-modal-overlay" onClick={() => setSelectedPair(null)}>
          <div className="forex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💱 {selectedPair.pair} - Analyse Détaillée</h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedPair(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="forex-analysis">
                {/* Graphique simple */}
                <div className="analysis-section">
                  <h4>📈 Évolution des 30 derniers jours</h4>
                  <div className="simple-chart">
                    <ForexChart data={selectedPair.data.slice(-30)} />
                  </div>
                </div>

                {/* Statistiques */}
                <div className="analysis-section">
                  <h4>📊 Statistiques</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h5>Plus haut (30j)</h5>
                      <span className="stat-value">
                        {Math.max(...selectedPair.data.slice(-30).map(d => d.high)).toFixed(5)}
                      </span>
                    </div>
                    <div className="stat-card">
                      <h5>Plus bas (30j)</h5>
                      <span className="stat-value">
                        {Math.min(...selectedPair.data.slice(-30).map(d => d.low)).toFixed(5)}
                      </span>
                    </div>
                    <div className="stat-card">
                      <h5>Moyenne (30j)</h5>
                      <span className="stat-value">
                        {(selectedPair.data.slice(-30).reduce((sum, d) => sum + d.close, 0) / 30).toFixed(5)}
                      </span>
                    </div>
                    <div className="stat-card">
                      <h5>Volatilité moyenne</h5>
                      <span className="stat-value">
                        {(selectedPair.data.slice(-30).reduce((sum, d) => sum + ((d.high - d.low) / d.open), 0) / 30 * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations sur la paire */}
                <div className="analysis-section">
                  <h4>ℹ️ Informations sur la paire</h4>
                  <div className="pair-info">
                    {getPairInfo(selectedPair.pair)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section d'aide */}
      <div className="forex-help">
        <h4>💡 Comprendre le Forex</h4>
        <div className="help-grid">
          <div className="help-card">
            <h5>📊 Lecture des prix</h5>
            <p>Le prix indique combien d'unités de la devise de droite sont nécessaires pour acheter une unité de la devise de gauche.</p>
          </div>
          <div className="help-card">
            <h5>🎯 Paires majeures</h5>
            <p>Les paires incluant USD sont les plus liquides et ont généralement les spreads les plus faibles.</p>
          </div>
          <div className="help-card">
            <h5>⏰ Horaires de trading</h5>
            <p>Le marché forex est ouvert 24h/24, 5j/7, avec des pics d'activité lors des chevauchements de sessions.</p>
          </div>
          <div className="help-card">
            <h5>📈 Volatilité</h5>
            <p>La volatilité mesure l'amplitude des mouvements de prix. Plus elle est élevée, plus le risque et les opportunités sont importants.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour le graphique simple
const ForexChart = ({ data }) => {
  if (!data || data.length === 0) return <div>Pas de données pour le graphique</div>;

  const width = 400;
  const height = 200;
  const padding = 20;

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = padding + ((maxPrice - d.close) / priceRange) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1].close >= data[0].close;

  return (
    <div className="forex-chart">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="forexGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        
        {/* Grille */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Ligne de prix */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Zone sous la courbe */}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill="url(#forexGradient)"
        />
      </svg>
      
      <div className="chart-labels">
        <span className="chart-start">{data[0].close.toFixed(5)}</span>
        <span className="chart-end">{data[data.length - 1].close.toFixed(5)}</span>
      </div>
    </div>
  );
};

// Fonction pour obtenir des informations sur une paire
const getPairInfo = (pair) => {
  const pairInfo = {
    'EUR/USD': {
      name: 'Euro / Dollar américain',
      description: 'La paire de devises la plus tradée au monde',
      session: 'Londres-New York',
      volatility: 'Modérée'
    },
    'GBP/USD': {
      name: 'Livre sterling / Dollar américain',
      description: 'Surnommée "Cable", très volatile',
      session: 'Londres-New York',
      volatility: 'Élevée'
    },
    'USD/JPY': {
      name: 'Dollar américain / Yen japonais',
      description: 'Paire très liquide, populaire en Asie',
      session: 'Tokyo-Londres',
      volatility: 'Modérée'
    },
    'USD/CHF': {
      name: 'Dollar américain / Franc suisse',
      description: 'Valeur refuge, corrélée négativement avec EUR/USD',
      session: 'Londres-New York',
      volatility: 'Faible'
    },
    'AUD/USD': {
      name: 'Dollar australien / Dollar américain',
      description: 'Sensible aux matières premières',
      session: 'Sydney-Londres',
      volatility: 'Modérée à élevée'
    },
    'USD/CAD': {
      name: 'Dollar américain / Dollar canadien',
      description: 'Influencée par le prix du pétrole',
      session: 'New York-Londres',
      volatility: 'Modérée'
    }
  };

  const info = pairInfo[pair] || {
    name: pair,
    description: 'Paire de devises',
    session: 'Variable',
    volatility: 'Variable'
  };

  return (
    <div className="pair-details-info">
      <div className="info-row">
        <strong>Nom complet:</strong> {info.name}
      </div>
      <div className="info-row">
        <strong>Description:</strong> {info.description}
      </div>
      <div className="info-row">
        <strong>Session principale:</strong> {info.session}
      </div>
      <div className="info-row">
        <strong>Volatilité:</strong> {info.volatility}
      </div>
    </div>
  );
};

export default ForexPairs;