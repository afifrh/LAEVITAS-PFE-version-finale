import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './PriceChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ symbol, interval = '1h', height = 300, showVolume = false }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  useEffect(() => {
    fetchPriceData();
    const interval_id = setInterval(fetchPriceData, 30000); // Actualiser toutes les 30 secondes
    
    return () => clearInterval(interval_id);
  }, [symbol, interval]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/api/binance/klines/${symbol}?interval=${interval}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        processChartData(result.data);
      } else {
        throw new Error('Données invalides reçues');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (klineData) => {
    const labels = klineData.map(item => {
      const date = new Date(item.openTime);
      return date.toLocaleString('fr-FR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    const prices = klineData.map(item => item.close);
    const volumes = klineData.map(item => item.volume);

    // Calculer le changement de prix
    if (prices.length >= 2) {
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = lastPrice - firstPrice;
      const changePercent = ((change / firstPrice) * 100).toFixed(2);
      
      setCurrentPrice(lastPrice);
      setPriceChange({
        absolute: change.toFixed(2),
        percent: changePercent,
        isPositive: change >= 0
      });
    }

    // Créer un gradient pour la ligne
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    
    const isPositive = prices[prices.length - 1] >= prices[0];
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(39, 174, 96, 0.3)');
      gradient.addColorStop(1, 'rgba(39, 174, 96, 0.05)');
    } else {
      gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
      gradient.addColorStop(1, 'rgba(231, 76, 60, 0.05)');
    }

    const datasets = [
      {
        label: 'Prix',
        data: prices,
        borderColor: isPositive ? '#27ae60' : '#e74c3c',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? '#27ae60' : '#e74c3c',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }
    ];

    if (showVolume) {
      datasets.push({
        label: 'Volume',
        data: volumes,
        type: 'bar',
        backgroundColor: 'rgba(52, 152, 219, 0.3)',
        borderColor: '#3498db',
        borderWidth: 1,
        yAxisID: 'y1',
        order: 2
      });
    }

    setChartData({
      labels,
      datasets
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3498db',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Prix: ${context.parsed.y.toFixed(2)} USDT`;
            } else if (context.datasetIndex === 1) {
              return `Volume: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#666'
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          callback: function(value) {
            return value.toFixed(2);
          }
        }
      },
      ...(showVolume && {
        y1: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#666'
          }
        }
      })
    },
    elements: {
      point: {
        radius: 0
      }
    }
  };

  if (loading) {
    return (
      <div className="price-chart loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-chart error">
        <div className="error-content">
          <p>Erreur: {error}</p>
          <button onClick={fetchPriceData} className="retry-btn">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="price-chart">
      <div className="chart-header">
        <div className="price-info">
          <h3 className="symbol">{symbol}</h3>
          {currentPrice && (
            <div className="price-display">
              <span className="current-price">${currentPrice.toFixed(2)}</span>
              {priceChange && (
                <span className={`price-change ${priceChange.isPositive ? 'positive' : 'negative'}`}>
                  {priceChange.isPositive ? '+' : ''}{priceChange.absolute} ({priceChange.percent}%)
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="chart-controls">
          <button onClick={fetchPriceData} className="refresh-btn" title="Actualiser">
            🔄
          </button>
        </div>
      </div>

      <div className="chart-container" style={{ height: `${height}px` }}>
        {chartData && (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default PriceChart;