import React, { useState } from 'react';
import TradingService from '../services/tradingService';
import './CryptoTable.css';

const CryptoTable = ({ cryptos, compact = false }) => {
  const [sortField, setSortField] = useState('marketCapRank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Trier les données
  const sortedCryptos = [...cryptos].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Gérer le tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Icône de tri
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (!cryptos || cryptos.length === 0) {
    return (
      <div className="crypto-table-empty">
        <p>Aucune donnée de cryptomonnaie disponible</p>
      </div>
    );
  }

  return (
    <div className={`crypto-table-container ${compact ? 'compact' : ''}`}>
      <div className="crypto-table-wrapper">
        <table className="crypto-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('marketCapRank')} className="sortable">
                # {getSortIcon('marketCapRank')}
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Nom {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('currentPrice')} className="sortable">
                Prix {getSortIcon('currentPrice')}
              </th>
              <th onClick={() => handleSort('priceChangePercentage1h')} className="sortable">
                1h % {getSortIcon('priceChangePercentage1h')}
              </th>
              <th onClick={() => handleSort('priceChangePercentage24h')} className="sortable">
                24h % {getSortIcon('priceChangePercentage24h')}
              </th>
              <th onClick={() => handleSort('priceChangePercentage7d')} className="sortable">
                7j % {getSortIcon('priceChangePercentage7d')}
              </th>
              {!compact && (
                <>
                  <th onClick={() => handleSort('totalVolume')} className="sortable">
                    Volume 24h {getSortIcon('totalVolume')}
                  </th>
                  <th onClick={() => handleSort('marketCap')} className="sortable">
                    Market Cap {getSortIcon('marketCap')}
                  </th>
                  <th>Graphique 7j</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedCryptos.map((crypto) => (
              <tr key={crypto.id} className="crypto-row">
                <td className="rank">{crypto.marketCapRank}</td>
                <td className="crypto-info">
                  <div className="crypto-name-container">
                    <img 
                      src={crypto.image} 
                      alt={crypto.name}
                      className="crypto-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="crypto-names">
                      <span className="crypto-name">{crypto.name}</span>
                      <span className="crypto-symbol">{crypto.symbol}</span>
                    </div>
                  </div>
                </td>
                <td className="price">
                  {TradingService.formatCurrency(crypto.currentPrice)}
                </td>
                <td className={`percentage ${crypto.priceChangePercentage1h >= 0 ? 'positive' : 'negative'}`}>
                  {crypto.priceChangePercentage1h ? 
                    `${crypto.priceChangePercentage1h.toFixed(2)}%` : 'N/A'}
                </td>
                <td className={`percentage ${crypto.priceChangePercentage24h >= 0 ? 'positive' : 'negative'}`}>
                  {crypto.priceChangePercentage24h ? 
                    `${crypto.priceChangePercentage24h.toFixed(2)}%` : 'N/A'}
                </td>
                <td className={`percentage ${crypto.priceChangePercentage7d >= 0 ? 'positive' : 'negative'}`}>
                  {crypto.priceChangePercentage7d ? 
                    `${crypto.priceChangePercentage7d.toFixed(2)}%` : 'N/A'}
                </td>
                {!compact && (
                  <>
                    <td className="volume">
                      {TradingService.formatLargeNumber(crypto.totalVolume)}$
                    </td>
                    <td className="market-cap">
                      {TradingService.formatLargeNumber(crypto.marketCap)}$
                    </td>
                    <td className="sparkline">
                      <MiniChart data={crypto.sparklineIn7d} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Composant pour le mini graphique
const MiniChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="mini-chart-empty">-</div>;
  }

  const width = 100;
  const height = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  if (range === 0) {
    return <div className="mini-chart-flat">—</div>;
  }

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <div className="mini-chart">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default CryptoTable;