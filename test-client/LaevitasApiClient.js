/**
 * Client de test pour l'API Laevitas Trading Platform
 * 
 * Ce client permet de tester facilement toutes les fonctionnalités de l'API
 * incluant l'authentification, la gestion des utilisateurs et l'administration.
 * 
 * @author Assistant IA
 * @version 1.0.0
 */

class LaevitasApiClient {
  constructor(baseUrl = 'http://localhost:5000/api') {
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
  }

  /**
   * Effectue une requête HTTP vers l'API
   * @param {string} endpoint - L'endpoint de l'API
   * @param {Object} options - Options de la requête (method, body, headers)
   * @returns {Promise<Object>} Réponse de l'API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Ajouter le token d'authentification si disponible
    if (this.accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      console.log(`🚀 ${config.method} ${url}`);
      if (options.body) {
        console.log('📤 Body:', JSON.stringify(options.body, null, 2));
      }

      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`📥 Response (${response.status}):`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Erreur inconnue'}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur de requête:', error.message);
      throw error;
    }
  }

  /**
   * Définit les tokens d'authentification
   * @param {string} accessToken - Token d'accès
   * @param {string} refreshToken - Token de rafraîchissement
   */
  setTokens(accessToken, refreshToken = null) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    console.log('🔑 Tokens définis avec succès');
  }

  /**
   * Supprime les tokens d'authentification
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    console.log('🔓 Tokens supprimés');
  }

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns {boolean} True si connecté
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Vérifie si l'utilisateur est admin
   * @returns {boolean} True si admin
   */
  isAdmin() {
    return this.user && this.user.role === 'admin';
  }

  /**
   * Affiche les informations de l'utilisateur connecté
   */
  showUserInfo() {
    if (this.user) {
      console.log('👤 Utilisateur connecté:', {
        id: this.user._id,
        nom: `${this.user.firstName} ${this.user.lastName}`,
        email: this.user.email,
        role: this.user.role,
        statut: this.user.accountStatus
      });
    } else {
      console.log('❌ Aucun utilisateur connecté');
    }
  }

  // ==========================================
  // MÉTHODES D'AUTHENTIFICATION
  // ==========================================

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: userData
    });

    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      this.user = response.data.user;
    }

    return response;
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email, password) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      this.user = response.data.user;
    }

    return response;
  }

  /**
   * Rafraîchissement du token d'accès
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    const response = await this.makeRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: this.refreshToken }
    });

    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }

    return response;
  }

  /**
   * Déconnexion
   */
  async logout() {
    const response = await this.makeRequest('/auth/logout', {
      method: 'POST',
      body: { refreshToken: this.refreshToken }
    });

    this.clearTokens();
    return response;
  }

  /**
   * Déconnexion de tous les appareils
   */
  async logoutAll() {
    const response = await this.makeRequest('/auth/logout-all', {
      method: 'POST'
    });

    this.clearTokens();
    return response;
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  async getMe() {
    const response = await this.makeRequest('/auth/me');
    
    if (response.success && response.data) {
      this.user = response.data.user;
    }

    return response;
  }

  /**
   * Vérifier la validité du token
   */
  async verifyToken() {
    return await this.makeRequest('/auth/verify-token', {
      method: 'POST'
    });
  }

  // ==========================================
  // MÉTHODES DE GESTION DES UTILISATEURS
  // ==========================================

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(profileData) {
    const response = await this.makeRequest('/users/profile', {
      method: 'PUT',
      body: profileData
    });

    if (response.success && response.data) {
      this.user = response.data.user;
    }

    return response;
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return await this.makeRequest('/users/change-password', {
      method: 'PUT',
      body: {
        currentPassword,
        newPassword,
        confirmPassword
      }
    });
  }

  /**
   * Obtenir les informations d'un utilisateur spécifique
   */
  async getUser(userId) {
    return await this.makeRequest(`/users/${userId}`);
  }

  /**
   * Supprimer son compte
   */
  async deleteAccount() {
    const response = await this.makeRequest('/users/account', {
      method: 'DELETE'
    });

    this.clearTokens();
    return response;
  }

  // ==========================================
  // MÉTHODES D'ADMINISTRATION
  // ==========================================

  /**
   * Obtenir la liste de tous les utilisateurs (Admin)
   */
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return await this.makeRequest(endpoint);
  }

  /**
   * Obtenir les détails d'un utilisateur (Admin)
   */
  async getAdminUser(userId) {
    return await this.makeRequest(`/admin/users/${userId}`);
  }

  /**
   * Mettre à jour le statut d'un utilisateur (Admin)
   */
  async updateUserStatus(userId, status, reason = '') {
    return await this.makeRequest(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: { status, reason }
    });
  }

  /**
   * Mettre à jour le rôle d'un utilisateur (Admin)
   */
  async updateUserRole(userId, role) {
    return await this.makeRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: { role }
    });
  }

  /**
   * Supprimer un utilisateur (Admin)
   */
  async deleteUser(userId) {
    return await this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur (Admin)
   */
  async resetUserPassword(userId) {
    return await this.makeRequest(`/admin/users/${userId}/reset-password`, {
      method: 'POST'
    });
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Tester la santé de l'API
   */
  async healthCheck() {
    return await this.makeRequest('/health');
  }

  /**
   * Afficher un résumé des capacités du client
   */
  showCapabilities() {
    console.log(`
🚀 Laevitas API Test Client v1.0.0
=====================================

📋 Fonctionnalités disponibles:

🔐 AUTHENTIFICATION:
  - register(userData)           : Inscription
  - login(email, password)       : Connexion
  - refreshAccessToken()         : Rafraîchir le token
  - logout()                     : Déconnexion
  - logoutAll()                  : Déconnexion globale
  - getMe()                      : Profil utilisateur
  - verifyToken()                : Vérifier le token

👤 GESTION UTILISATEUR:
  - updateProfile(data)          : Mettre à jour le profil
  - changePassword(old, new)     : Changer le mot de passe
  - getUser(userId)              : Obtenir un utilisateur
  - deleteAccount()              : Supprimer son compte

⚙️ ADMINISTRATION:
  - getAllUsers(params)          : Liste des utilisateurs
  - getAdminUser(userId)         : Détails utilisateur
  - updateUserStatus(id, status) : Modifier le statut
  - updateUserRole(id, role)     : Modifier le rôle
  - deleteUser(userId)           : Supprimer un utilisateur
  - resetUserPassword(userId)    : Réinitialiser le mot de passe

🔧 UTILITAIRES:
  - healthCheck()                : Santé de l'API
  - showUserInfo()               : Infos utilisateur connecté
  - showCapabilities()           : Cette aide

📊 État actuel:
  - Connecté: ${this.isAuthenticated() ? '✅' : '❌'}
  - Admin: ${this.isAdmin() ? '✅' : '❌'}
  - API: ${this.baseUrl}
    `);
  }
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LaevitasApiClient;
}

// Export pour le navigateur
if (typeof window !== 'undefined') {
  window.LaevitasApiClient = LaevitasApiClient;
}