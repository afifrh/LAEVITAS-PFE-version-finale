import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Composant qui redirige automatiquement vers la bonne page selon le rôle de l'utilisateur
 */
const RoleBasedRedirect = () => {
  const { user, isAuthenticated, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Éviter les redirections multiples
    if (hasRedirected.current || status === 'loading') return;

    let targetPath = null;

    if (!isAuthenticated || !user) {
      targetPath = '/login';
    } else if (user.role === 'admin') {
      targetPath = '/admin/dashboard';
    } else {
      targetPath = '/dashboard';
    }

    // Ne rediriger que si on n'est pas déjà sur la bonne page
    if (targetPath && location.pathname !== targetPath) {
      hasRedirected.current = true;
      navigate(targetPath, { replace: true });
    }
  }, [status, isAuthenticated, user, navigate, location.pathname]);

  // Toujours afficher le loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirection...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;