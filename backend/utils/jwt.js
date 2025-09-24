const jwt = require('jsonwebtoken');

/**
 * Génère un token d'accès JWT
 * @param {Object} payload - Les données à inclure dans le token
 * @returns {String} Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'laevitas-trading',
      audience: 'laevitas-users'
    }
  );
};

/**
 * Génère un refresh token JWT
 * @param {Object} payload - Les données à inclure dans le token
 * @returns {String} Refresh token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
      issuer: 'laevitas-trading',
      audience: 'laevitas-users'
    }
  );
};

/**
 * Vérifie un token d'accès
 * @param {String} token - Le token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'laevitas-trading',
      audience: 'laevitas-users'
    });
  } catch (error) {
    throw new Error('Token d\'accès invalide ou expiré');
  }
};

/**
 * Vérifie un refresh token
 * @param {String} token - Le refresh token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'laevitas-trading',
      audience: 'laevitas-users'
    });
  } catch (error) {
    throw new Error('Refresh token invalide ou expiré');
  }
};

/**
 * Génère une paire de tokens (access + refresh)
 * @param {Object} user - L'utilisateur pour lequel générer les tokens
 * @returns {Object} Objet contenant accessToken et refreshToken
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user._id });

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRE || '15m'
  };
};

/**
 * Extrait le token du header Authorization
 * @param {String} authHeader - Header Authorization
 * @returns {String|null} Token extrait ou null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Décode un token sans le vérifier (pour obtenir les infos même si expiré)
 * @param {String} token - Le token à décoder
 * @returns {Object|null} Payload décodé ou null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Vérifie si un token est expiré
 * @param {String} token - Le token à vérifier
 * @returns {Boolean} True si expiré, false sinon
 */
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Calcule le temps restant avant expiration d'un token
 * @param {String} token - Le token à analyser
 * @returns {Number} Temps restant en secondes (0 si expiré)
 */
const getTokenTimeRemaining = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = decoded.exp - currentTime;
  
  return Math.max(0, timeRemaining);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  extractTokenFromHeader,
  decodeToken,
  isTokenExpired,
  getTokenTimeRemaining
};