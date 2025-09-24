import { useContext, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

// Hook personnalisé pour l'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  const {
    user,
    status,
    error,
    isAuthenticated,
    isAdmin,
    isClient,
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    updateUser,
    refreshUser,
    hasPermission,
    canAccess,
    clearError,
    setError
  } = context;

  // Fonction de connexion avec redirection
  const login = useCallback(async (credentials, redirectTo) => {
    const result = await contextLogin(credentials);
    
    if (result.success) {
      // Rediriger vers la page demandée ou le dashboard par défaut
      const destination = redirectTo || 
                         location.state?.from?.pathname || 
                         (result.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      
      navigate(destination, { replace: true });
    }
    
    return result;
  }, [contextLogin, navigate, location.state]);

  // Fonction d'inscription avec redirection
  const register = useCallback(async (userData, redirectTo) => {
    const result = await contextRegister(userData);
    
    if (result.success) {
      // Rediriger vers la page demandée ou le dashboard par défaut
      const destination = redirectTo || 
                         (result.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      
      navigate(destination, { replace: true });
    }
    
    return result;
  }, [contextRegister, navigate]);

  // Fonction de déconnexion avec redirection
  const logout = useCallback(async (logoutAll = false, redirectTo = '/') => {
    await contextLogout(logoutAll);
    navigate(redirectTo, { replace: true });
  }, [contextLogout, navigate]);

  // Fonction pour rediriger vers la connexion
  const redirectToLogin = useCallback((message) => {
    if (message) {
      setError(message);
    }
    
    navigate('/login', {
      state: { from: location },
      replace: true
    });
  }, [navigate, location, setError]);

  // Fonction pour vérifier et rediriger si non autorisé
  const requireAuth = useCallback((requiredRole) => {
    if (!isAuthenticated) {
      redirectToLogin('Vous devez être connecté pour accéder à cette page');
      return false;
    }
    
    if (requiredRole && !hasPermission(requiredRole)) {
      setError('Vous n\'avez pas les permissions nécessaires');
      navigate('/unauthorized', { replace: true });
      return false;
    }
    
    return true;
  }, [isAuthenticated, hasPermission, redirectToLogin, setError, navigate]);

  // Fonction pour vérifier l'accès à une ressource
  const requireResourceAccess = useCallback((resourceOwnerId, errorMessage) => {
    if (!isAuthenticated) {
      redirectToLogin('Vous devez être connecté pour accéder à cette ressource');
      return false;
    }
    
    if (!canAccess(resourceOwnerId)) {
      setError(errorMessage || 'Vous n\'avez pas accès à cette ressource');
      navigate('/unauthorized', { replace: true });
      return false;
    }
    
    return true;
  }, [isAuthenticated, canAccess, redirectToLogin, setError, navigate]);

  // États dérivés
  const authState = useMemo(() => ({
    isLoading: status === 'loading',
    isAuthenticated,
    isAdmin,
    isClient,
    hasError: !!error,
    user
  }), [status, isAuthenticated, isAdmin, isClient, error, user]);

  // Informations utilisateur formatées
  const userInfo = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase(),
      email: user.email,
      role: user.role,
      isVerified: user.isEmailVerified,
      avatar: user.avatar,
      preferences: user.tradingPreferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  }, [user]);

  // Fonctions utilitaires
  const utils = useMemo(() => ({
    // Vérifier si l'utilisateur est le propriétaire d'une ressource
    isOwner: (resourceOwnerId) => user?._id === resourceOwnerId,
    
    // Vérifier si l'utilisateur peut modifier une ressource
    canEdit: (resourceOwnerId) => isAdmin || user?._id === resourceOwnerId,
    
    // Vérifier si l'utilisateur peut supprimer une ressource
    canDelete: (resourceOwnerId) => isAdmin || user?._id === resourceOwnerId,
    
    // Obtenir le rôle affiché
    getRoleDisplay: () => {
      if (!user) return '';
      return user.role === 'admin' ? 'Administrateur' : 'Client';
    },
    
    // Vérifier si le compte est actif
    isAccountActive: () => user?.accountStatus === 'active',
    
    // Vérifier si le compte est suspendu
    isAccountSuspended: () => user?.accountStatus === 'suspended',
    
    // Vérifier si l'email est vérifié
    isEmailVerified: () => user?.isEmailVerified === true
  }), [user, isAdmin]);

  return {
    // État d'authentification
    ...authState,
    error,
    
    // Informations utilisateur
    user,
    userInfo,
    
    // Actions principales
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    
    // Gestion des permissions
    hasPermission,
    canAccess,
    requireAuth,
    requireResourceAccess,
    
    // Navigation
    redirectToLogin,
    
    // Gestion des erreurs
    clearError,
    setError,
    
    // Utilitaires
    ...utils
  };
};

// Hook pour les routes protégées
export const useProtectedRoute = (requiredRole) => {
  const { requireAuth } = useAuth();
  
  return useCallback(() => {
    return requireAuth(requiredRole);
  }, [requireAuth, requiredRole]);
};

// Hook pour vérifier l'accès aux ressources
export const useResourceAccess = () => {
  const { requireResourceAccess } = useAuth();
  
  return useCallback((resourceOwnerId, errorMessage) => {
    return requireResourceAccess(resourceOwnerId, errorMessage);
  }, [requireResourceAccess]);
};

export default useAuth;