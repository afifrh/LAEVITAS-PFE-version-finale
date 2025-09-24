import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requireEmailVerification = false,
  fallbackPath = '/login',
  unauthorizedPath = '/unauthorized'
}) => {
  const { 
    status, 
    isAuthenticated, 
    user, 
    hasPermission
  } = useAuth();
  const location = useLocation();

  // Afficher le spinner pendant le chargement
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Rediriger vers la connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Vérifier la vérification d'email si requise (fonctionnalité à implémenter)
  // if (requireEmailVerification && !isEmailVerified()) {
  //   return (
  //     <Navigate 
  //       to="/verify-email" 
  //       state={{ from: location }} 
  //       replace 
  //     />
  //   );
  // }

  // Vérifier les permissions de rôle
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <Navigate 
        to={unauthorizedPath} 
        state={{ 
          from: location,
          requiredRole,
          userRole: user?.role 
        }} 
        replace 
      />
    );
  }

  // Vérifier si le compte est actif
  if (user?.accountStatus !== 'active') {
    return (
      <Navigate 
        to="/account-suspended" 
        state={{ 
          from: location,
          status: user?.accountStatus 
        }} 
        replace 
      />
    );
  }

  // Rendre le composant enfant si toutes les vérifications passent
  return children;
};

// Composant pour les routes d'administration
export const AdminRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requiredRole="admin" 
      unauthorizedPath="/unauthorized"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// Composant pour les routes client
export const ClientRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requiredRole="client" 
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// Composant pour les routes nécessitant une vérification d'email
export const VerifiedRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requireEmailVerification={true}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// Composant pour rediriger les utilisateurs authentifiés
export const GuestRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { status, isAuthenticated, user } = useAuth();

  // Afficher le spinner pendant le chargement
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Rediriger vers le dashboard si déjà authentifié
  if (isAuthenticated) {
    const destination = user?.role === 'admin' ? '/admin/dashboard' : redirectTo;
    return <Navigate to={destination} replace />;
  }

  // Rendre le composant enfant si non authentifié
  return children;
};

// Composant pour les routes conditionnelles basées sur le rôle
export const RoleBasedRoute = ({ 
  children, 
  adminComponent, 
  clientComponent, 
  guestComponent,
  ...props 
}) => {
  const { isLoading, isAuthenticated, isAdmin, isClient } = useAuth();

  // Afficher le spinner pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Rendre le composant approprié selon le rôle
  if (!isAuthenticated && guestComponent) {
    return guestComponent;
  }

  if (isAdmin && adminComponent) {
    return (
      <ProtectedRoute requiredRole="admin" {...props}>
        {adminComponent}
      </ProtectedRoute>
    );
  }

  if (isClient && clientComponent) {
    return (
      <ProtectedRoute requiredRole="client" {...props}>
        {clientComponent}
      </ProtectedRoute>
    );
  }

  // Composant par défaut
  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;