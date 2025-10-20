import axios from 'axios';
import toast from 'react-hot-toast';

// Configuration de base d'Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Instance Axios principale
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gestion du token d'authentification
let authToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Fonction pour définir le token d'authentification
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
  }
};

// Fonction pour définir le refresh token
export const setRefreshToken = (token) => {
  refreshToken = token;
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

// Initialiser le token au démarrage
if (authToken) {
  setAuthToken(authToken);
}

// Variable pour éviter les appels de refresh multiples
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification si disponible
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Log des requêtes en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => {
    // Log des réponses en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Éviter de rafraîchir le token pour les routes d'authentification
    const authRoutes = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
    const isAuthRoute = authRoutes.some(route => originalRequest.url.includes(route));
    
    // Si l'erreur est 401, pas une route d'auth, et qu'on a un refresh token
    if (error.response?.status === 401 && !isAuthRoute && refreshToken && !originalRequest._retry) {
      
      if (isRefreshing) {
        // Si on est déjà en train de rafraîchir, mettre en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Tenter de rafraîchir le token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Mettre à jour les tokens
        setAuthToken(accessToken);
        setRefreshToken(newRefreshToken);
        
        processQueue(null, accessToken);
        
        // Réessayer la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        console.error('Erreur lors du rafraîchissement du token:', refreshError);
        processQueue(refreshError, null);
        
        setAuthToken(null);
        setRefreshToken(null);
        
        // Rediriger vers la page de connexion
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Gestion des erreurs avec messages utilisateur
    const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
    
    // Ne pas afficher de toast pour certaines erreurs
    const silentErrors = [401, 403];
    if (!silentErrors.includes(error.response?.status)) {
      toast.error(errorMessage);
    }
    
    // Log des erreurs en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  // Connexion
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  // Déconnexion
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },
  
  // Déconnexion de tous les appareils
  logoutAll: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },
  
  // Obtenir le profil utilisateur
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Vérifier le token
  verifyToken: async () => {
    const response = await api.post('/auth/verify-token');
    return response.data;
  },
  
  // Rafraîchir le token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
};

// Services utilisateur
export const userService = {
  // Obtenir le profil
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  
  // Mettre à jour les préférences de trading
  updateTradingPreferences: async (preferences) => {
    const response = await api.put('/users/trading-preferences', preferences);
    return response.data;
  },
  
  // Changer le mot de passe
  changePassword: async (passwordData) => {
    const response = await api.put('/users/change-password', passwordData);
    return response.data;
  },
  
  // Supprimer le compte
  deleteAccount: async (password) => {
    const response = await api.delete('/users/account', { data: { password } });
    return response.data;
  },
  
  // Obtenir un utilisateur par ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

// Services admin
export const adminService = {
  // Obtenir tous les utilisateurs
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  // Obtenir un utilisateur par ID
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  // Créer un nouvel utilisateur
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
  
  // Mettre à jour complètement un utilisateur
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },
  
  // Modifier le statut d'un utilisateur
  updateUserStatus: async (userId, status, reason) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status, reason });
    return response.data;
  },
  
  // Modifier le rôle d'un utilisateur
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  
  // Supprimer un utilisateur
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  
  // Obtenir les statistiques du dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  
  // Réinitialiser le mot de passe d'un utilisateur
  resetUserPassword: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/reset-password`);
    return response.data;
  }
};

// Services de portefeuille
export const portfolioService = {
  // Obtenir le portefeuille de l'utilisateur
  getPortfolio: async () => {
    const response = await api.get('/portfolio');
    return response.data.data;
  },
  
  // Ajouter un actif au portefeuille
  addAsset: async (assetData) => {
    const response = await api.post('/portfolio/assets', assetData);
    return response.data.data;
  },
  
  // Vendre un actif du portefeuille
  sellAsset: async (sellData) => {
    const response = await api.post('/portfolio/assets/sell', sellData);
    return response.data.data;
  },
  
  // Obtenir les transactions du portefeuille
  getTransactions: async (params = {}) => {
    const response = await api.get('/portfolio/transactions', { params });
    return response.data.data.transactions || [];
  },
  
  // Mettre à jour les prix des actifs
  updatePrices: async (prices) => {
    const response = await api.put('/portfolio/prices', { prices });
    return response.data.data;
  },
  
  // Obtenir les statistiques du portefeuille
  getStats: async () => {
    const response = await api.get('/portfolio/stats');
    return response.data.data;
  },
  
  // Ajouter une transaction au portefeuille
  addTransaction: async (transactionData) => {
    const response = await api.post('/portfolio/assets', {
      symbol: transactionData.symbol,
      name: transactionData.symbol,
      type: 'crypto',
      quantity: parseFloat(transactionData.amount),
      price: parseFloat(transactionData.price),
      notes: transactionData.notes
    });
    return response.data.data;
  },

  // Supprimer complètement un actif du portefeuille
  removeAsset: async (symbol) => {
    const response = await api.delete(`/portfolio/assets/${symbol}`);
    return response.data.data;
  },

  // Effectuer un dépôt
  deposit: async (depositData) => {
    const response = await api.post('/portfolio/deposit', depositData);
    return response.data.data;
  },

  // Effectuer un retrait
  withdraw: async (withdrawData) => {
    const response = await api.post('/portfolio/withdraw', withdrawData);
    return response.data.data;
  }
};

// Service de santé de l'API
export const healthService = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

// Fonction utilitaire pour gérer les erreurs d'API
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Données invalides';
      case 401:
        return 'Non autorisé. Veuillez vous connecter.';
      case 403:
        return 'Accès refusé. Privilèges insuffisants.';
      case 404:
        return 'Ressource non trouvée';
      case 409:
        return data.message || 'Conflit de données';
      case 422:
        return data.message || 'Données non valides';
      case 429:
        return 'Trop de requêtes. Veuillez réessayer plus tard.';
      case 500:
        return 'Erreur interne du serveur';
      default:
        return data.message || 'Une erreur est survenue';
    }
  } else if (error.request) {
    return 'Erreur de connexion. Vérifiez votre connexion internet.';
  } else {
    return error.message || 'Une erreur inattendue est survenue';
  }
};

export default api;