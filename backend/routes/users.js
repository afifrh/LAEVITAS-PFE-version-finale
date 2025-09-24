const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
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
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private
 */
router.put('/profile', authenticate, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Veuillez entrer une date de naissance valide'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('L\'adresse ne peut pas dépasser 100 caractères'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La ville ne peut pas dépasser 50 caractères'),
  body('address.postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne peut pas dépasser 20 caractères'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le pays ne peut pas dépasser 50 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 'address'
    ];
    
    const updates = {};
    
    // Filtrer les champs autorisés
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    const userProfile = updatedUser.getPublicProfile();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   PUT /api/users/trading-preferences
 * @desc    Mettre à jour les préférences de trading
 * @access  Private
 */
router.put('/trading-preferences', authenticate, [
  body('riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Le niveau de risque doit être low, medium ou high'),
  body('preferredCurrencies')
    .optional()
    .isArray()
    .withMessage('Les devises préférées doivent être un tableau'),
  body('preferredCurrencies.*')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Chaque devise doit contenir entre 2 et 10 caractères'),
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('La notification email doit être un booléen'),
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('La notification push doit être un booléen'),
  body('notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('La notification SMS doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { riskLevel, preferredCurrencies, notifications } = req.body;
    
    const updates = {};
    
    if (riskLevel) {
      updates['tradingPreferences.riskLevel'] = riskLevel;
    }
    
    if (preferredCurrencies) {
      // Convertir en majuscules et supprimer les doublons
      const currencies = [...new Set(preferredCurrencies.map(c => c.toUpperCase()))];
      updates['tradingPreferences.preferredCurrencies'] = currencies;
    }
    
    if (notifications) {
      if (notifications.email !== undefined) {
        updates['tradingPreferences.notifications.email'] = notifications.email;
      }
      if (notifications.push !== undefined) {
        updates['tradingPreferences.notifications.push'] = notifications.push;
      }
      if (notifications.sms !== undefined) {
        updates['tradingPreferences.notifications.sms'] = notifications.sms;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    const userProfile = updatedUser.getPublicProfile();

    res.json({
      success: true,
      message: 'Préférences de trading mises à jour avec succès',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Changer le mot de passe de l'utilisateur
 * @access  Private
 */
router.put('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select('+password');

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Supprimer tous les refresh tokens pour forcer une nouvelle connexion
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès. Veuillez vous reconnecter.'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   GET /api/users/:userId
 * @desc    Obtenir les informations d'un utilisateur spécifique
 * @access  Private (propriétaire ou admin)
 */
router.get('/:userId', authenticate, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   DELETE /api/users/account
 * @desc    Supprimer le compte de l'utilisateur connecté
 * @access  Private
 */
router.delete('/account', authenticate, [
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis pour supprimer le compte')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select('+password');

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;