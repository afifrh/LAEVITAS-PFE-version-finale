import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService, setAuthToken, setRefreshToken } from '../services/api';
import toast from 'react-hot-toast';

// États possibles de l'authentification
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// Actions du reducer
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// État initial
const initialState = {
  user: null,
  status: AUTH_STATES.LOADING,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  isClient: false
};

// Reducer pour gérer l'état d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        status: AUTH_STATES.LOADING,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        status: AUTH_STATES.AUTHENTICATED,
        error: null,
        isAuthenticated: true,
        isAdmin: action.payload.user.role === 'admin',
        isClient: action.payload.user.role === 'client'
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        status: AUTH_STATES.UNAUTHENTICATED,
        error: null,
        isAuthenticated: false,
        isAdmin: false,
        isClient: false
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isAdmin: action.payload.role === 'admin' || state.isAdmin,
        isClient: action.payload.role === 'client' || state.isClient
      };
      
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        status: AUTH_STATES.ERROR
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fonction pour vérifier l'authentification au démarrage
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token || !refreshToken) {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return;
    }
    
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      
      // Vérifier la validité du token
      const response = await authService.verifyToken();
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.data.user }
        });
      } else {
        throw new Error('Token invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      
      // Nettoyer les tokens invalides
      setAuthToken(null);
      setRefreshToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []); // Retirer dispatch des dépendances pour éviter les re-rendus

  // Fonction de connexion
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Sauvegarder les tokens
        setAuthToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        
        // Mettre à jour l'état
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
        
        toast.success(`Bienvenue, ${user.firstName} !`);
        return { success: true, user };
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur de connexion';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authService.register(userData);
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Sauvegarder les tokens
        setAuthToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        
        // Mettre à jour l'état
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
        
        toast.success(`Compte créé avec succès ! Bienvenue, ${user.firstName} !`);
        return { success: true, user };
      } else {
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction de déconnexion
  const logout = async (logoutAll = false) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        if (logoutAll) {
          await authService.logoutAll();
        } else {
          await authService.logout(refreshToken);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer les tokens et l'état
      setAuthToken(null);
      setRefreshToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      toast.success('Déconnexion réussie');
    }
  };

  // Fonction pour mettre à jour le profil utilisateur
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      
      if (response.success) {
        updateUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  // Fonction pour vérifier les permissions
  const hasPermission = (requiredRole) => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }
    
    if (requiredRole === 'admin') {
      return state.user.role === 'admin';
    }
    
    if (requiredRole === 'client') {
      return state.user.role === 'client' || state.user.role === 'admin';
    }
    
    return true;
  };

  // Fonction pour vérifier si l'utilisateur peut accéder à une ressource
  const canAccess = (resourceOwnerId) => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }
    
    // Les admins peuvent accéder à tout
    if (state.user.role === 'admin') {
      return true;
    }
    
    // Les utilisateurs peuvent accéder à leurs propres ressources
    return state.user._id === resourceOwnerId;
  };

  // Effet pour vérifier l'authentification au montage
  useEffect(() => {
    checkAuth();
  }, []); // Exécuter seulement au montage pour éviter les boucles

  // Valeur du contexte
  const contextValue = {
    // État
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    checkAuth,
    
    // Utilitaires
    hasPermission,
    canAccess,
    
    // Fonctions de gestion d'erreur
    clearError: () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR }),
    setError: (error) => dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error })
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;