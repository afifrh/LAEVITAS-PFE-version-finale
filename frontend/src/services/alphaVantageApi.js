// Service API Alpha Vantage pour les données de stocks et forex
// Note: Vous devez obtenir une clé API gratuite sur https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'demo'; // Remplacez par votre clé API

class AlphaVantageService {
  // Récupérer les données intraday d'une action
  async getStockIntraday(symbol, interval = '5min') {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données intraday de ${symbol}:`, error);
      throw error;
    }
  }

  // Récupérer les données quotidiennes d'une action
  async getStockDaily(symbol, outputsize = 'compact') {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données quotidiennes de ${symbol}:`, error);
      throw error;
    }
  }

  // Récupérer les données hebdomadaires d'une action
  async getStockWeekly(symbol) {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données hebdomadaires de ${symbol}:`, error);
      throw error;
    }
  }

  // Récupérer les données mensuelles d'une action
  async getStockMonthly(symbol) {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données mensuelles de ${symbol}:`, error);
      throw error;
    }
  }

  // Récupérer les données forex
  async getForexDaily(fromSymbol, toSymbol) {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données forex ${fromSymbol}/${toSymbol}:`, error);
      throw error;
    }
  }

  // Récupérer les données forex intraday
  async getForexIntraday(fromSymbol, toSymbol, interval = '5min') {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=FX_INTRADAY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&interval=${interval}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données forex intraday ${fromSymbol}/${toSymbol}:`, error);
      throw error;
    }
  }

  // Récupérer les indicateurs techniques - RSI
  async getRSI(symbol, interval = 'daily', timePeriod = 14, seriesType = 'close') {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=RSI&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=${seriesType}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du RSI de ${symbol}:`, error);
      throw error;
    }
  }

  // Récupérer les indicateurs techniques - MACD
  async getMACD(symbol, interval = 'daily', seriesType = 'close') {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=MACD&symbol=${symbol}&interval=${interval}&series_type=${seriesType}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du MACD de ${symbol}:`, error);
      throw error;
    }
  }

  // Récupérer les indicateurs techniques - Bollinger Bands
  async getBollingerBands(symbol, interval = 'daily', timePeriod = 20, seriesType = 'close') {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=BBANDS&symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&series_type=${seriesType}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des Bollinger Bands de ${symbol}:`, error);
      throw error;
    }
  }

  // Rechercher des symboles d'actions
  async searchSymbols(keywords) {
    try {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la recherche de symboles:', error);
      throw error;
    }
  }

  // Formater les données de séries temporelles
  formatTimeSeriesData(data, timeSeriesKey) {
    if (!data[timeSeriesKey]) {
      return [];
    }

    return Object.entries(data[timeSeriesKey]).map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']) || 0
    })).reverse(); // Inverser pour avoir les dates les plus récentes en dernier
  }

  // Formater les données forex
  formatForexData(data, timeSeriesKey) {
    if (!data[timeSeriesKey]) {
      return [];
    }

    return Object.entries(data[timeSeriesKey]).map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close'])
    })).reverse();
  }
}

export default new AlphaVantageService();