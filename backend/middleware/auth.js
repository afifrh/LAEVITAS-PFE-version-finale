const User = require('../models/User');
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');

/**
 * Middleware d'authentification
 * Vérifie la validité du token JWT et charge l'utilisateur
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraire le token du header Authorization
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Vérifier et décoder le token
    const decoded = verifyAccessToken(token);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le statut du compte
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif ou suspendu'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

/**
 * Middleware d'autorisation par rôle
 * @param {...string} roles - Les rôles autorisés
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Privilèges insuffisants.'
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }

  next();
};

/**
 * Middleware pour vérifier si l'utilisateur peut accéder à ses propres données
 * ou s'il est admin
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  const currentUserId = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  // Permettre l'accès si c'est l'utilisateur lui-même ou un admin
  if (currentUserId === targetUserId || isAdmin) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres données.'
    });
  }
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si aucun token n'est fourni, mais charge l'utilisateur si disponible
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user && user.accountStatus === 'active' && !user.isLocked) {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    next();
  }
};

/**
 * Middleware pour vérifier l'email vérifié
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email non vérifié. Veuillez vérifier votre email avant de continuer.'
    });
  }

  next();
};

/**
 * Middleware pour logger les accès aux routes protégées
 */
const logAccess = (req, res, next) => {
  if (req.user) {
    console.log(`🔐 Accès autorisé: ${req.user.email} (${req.user.role}) -> ${req.method} ${req.originalUrl}`);
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth,
  requireEmailVerified,
  logAccess
};