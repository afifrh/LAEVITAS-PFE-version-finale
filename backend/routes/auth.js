const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      console.log('Données reçues:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, dateOfBirth } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Créer le nouvel utilisateur
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: 'client' // Par défaut, les nouveaux utilisateurs sont des clients
    };

    // Ajouter les champs optionnels s'ils sont fournis
    if (phone) userData.phone = phone;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);

    const user = new User(userData);
    await user.save();

    // Générer les tokens
    const tokens = generateTokenPair(user);

    // Sauvegarder le refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      createdAt: new Date()
    });
    await user.save();

    // Retourner la réponse sans le mot de passe
    const userProfile = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: userProfile,
        tokens
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur et vérifier les identifiants
    const user = await User.findByCredentials(email, password);

    // Vérifier le statut du compte
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif ou suspendu. Contactez l\'administrateur.'
      });
    }

    // Générer les tokens
    const tokens = generateTokenPair(user);

    // Sauvegarder le refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      createdAt: new Date()
    });

    // Nettoyer les anciens refresh tokens (garder seulement les 5 plus récents)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    // Retourner la réponse
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userProfile,
        tokens
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    
    // Retourner un message générique pour les erreurs d'authentification
    if (error.message.includes('Email ou mot de passe incorrect') || 
        error.message.includes('Compte temporairement verrouillé')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Vérifier le refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que le refresh token existe dans la base de données
    const tokenExists = user.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide'
      });
    }

    // Vérifier le statut du compte
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif ou suspendu'
      });
    }

    // Générer de nouveaux tokens
    const tokens = generateTokenPair(user);

    // Remplacer l'ancien refresh token par le nouveau
    user.refreshTokens = user.refreshTokens.filter(tokenObj => tokenObj.token !== refreshToken);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Tokens rafraîchis avec succès',
      data: {
        tokens
      }
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token invalide ou expiré'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion d'un utilisateur
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Supprimer le refresh token spécifique
      req.user.refreshTokens = req.user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
    } else {
      // Si aucun refresh token spécifique, supprimer tous les tokens
      req.user.refreshTokens = [];
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Déconnexion de tous les appareils
 * @access  Private
 */
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    // Supprimer tous les refresh tokens
    req.user.refreshTokens = [];
    await req.user.save();

    res.json({
      success: true,
      message: 'Déconnexion de tous les appareils réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion globale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userProfile = req.user.getPublicProfile();
    
    res.json({
      success: true,
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/auth/verify-token
 * @desc    Vérifier la validité d'un token
 * @access  Private
 */
router.post('/verify-token', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token valide',
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demande de réinitialisation de mot de passe
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Chercher l'utilisateur
    const user = await User.findOne({ email });
    
    // Pour des raisons de sécurité, on retourne toujours le même message
    // même si l'utilisateur n'existe pas
    if (!user) {
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hasher le token avant de le sauvegarder
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Sauvegarder le token hashé et sa date d'expiration (1 heure)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 heure
    await user.save();

    // Envoyer l'email avec le token non hashé
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName
      );
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // Nettoyer le token si l'email échoue
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
      });
    }

    res.json({
      success: true,
      message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialisation du mot de passe avec token
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token de réinitialisation requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Hasher le token reçu pour le comparer avec celui en base
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Chercher l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = password; // Le middleware pre('save') va hasher le mot de passe
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Invalider tous les refresh tokens existants pour forcer une nouvelle connexion
    user.refreshTokens = [];
    
    await user.save();

    // Envoyer un email de confirmation (optionnel)
    try {
      await emailService.sendPasswordResetConfirmation(user.email, user.firstName);
    } catch (emailError) {
      console.error('Erreur envoi email de confirmation:', emailError);
      // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
    }

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.'
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;