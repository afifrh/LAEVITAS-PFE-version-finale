import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './CandlestickChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const CandlestickChart = ({ symbol, interval = '1h', height = 400 }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(interval);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchKlineData();
  }, [symbol, timeframe]);

  // Cleanup pour éviter les erreurs de canvas
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {
          // Ignore les erreurs de destruction
        }
      }
    };
  }, []);

  const fetchKlineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/api/binance/klines/${symbol}?interval=${timeframe}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data)) {
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
    if (!klineData || klineData.length === 0) {
      setError('Aucune donnée disponible');
      return;
    }

    const labels = klineData.map((item, index) => {
      const date = new Date(item.openTime);
      return date.toLocaleString('fr-FR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    // Données simplifiées pour les chandeliers
    const bullishData = [];
    const bearishData = [];

    klineData.forEach((item) => {
      const open = parseFloat(item.open);
      const close = parseFloat(item.close);
      const high = parseFloat(item.high);
      const low = parseFloat(item.low);
      
      const isBullish = close >= open;
      const bodySize = Math.abs(close - open);
      
      if (isBullish) {
        bullishData.push(bodySize);
        bearishData.push(0);
      } else {
        bearishData.push(bodySize);
        bullishData.push(0);
      }
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'Chandeliers Haussiers',
          data: bullishData,
          backgroundColor: '#26a69a',
          borderColor: '#26a69a',
          borderWidth: 1,
        },
        {
          label: 'Chandeliers Baissiers',
          data: bearishData,
          backgroundColor: '#ef5350',
          borderColor: '#ef5350',
          borderWidth: 1,
        }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${symbol} - Chandeliers (${timeframe})`,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#fff'
      },
      legend: {
        display: true,
        labels: {
          color: '#fff'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Temps',
          color: '#fff'
        },
        ticks: {
          color: '#fff',
          maxTicksLimit: 10
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Variation de Prix',
          color: '#fff'
        },
        ticks: {
          color: '#fff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ];

  if (loading) {
    return (
      <div className="candlestick-chart">
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candlestick-chart">
        <div className="chart-error">
          <p className="error-message">{error}</p>
          <button onClick={fetchKlineData} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="candlestick-chart">
      <div className="chart-header">
        <h3>📊 {symbol} - Graphique en Chandeliers</h3>
        <div className="chart-controls">
          <div className="timeframe-selector">
            <label>Période:</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="timeframe-select"
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={fetchKlineData} className="refresh-button">
            🔄 Actualiser
          </button>
        </div>
      </div>

      <div className="chart-container" style={{ height: `${height}px` }}>
        {chartData && (
          <Bar
            ref={chartRef}
            data={chartData}
            options={chartOptions}
          />
        )}
      </div>

      <div className="chart-footer">
        <p>Données en temps réel depuis Binance</p>
      </div>
    </div>
  );
};

export default CandlestickChart;