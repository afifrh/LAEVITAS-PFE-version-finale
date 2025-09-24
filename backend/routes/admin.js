const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Appliquer l'authentification et la vérification admin à toutes les routes
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Obtenir la liste de tous les utilisateurs avec pagination et filtres
 * @access  Admin
 */
router.get('/users', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  query('role')
    .optional()
    .isIn(['client', 'admin'])
    .withMessage('Le rôle doit être client ou admin'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Le statut doit être active, inactive, suspended ou pending'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Le terme de recherche ne peut pas être vide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construire les filtres
    const filters = {};
    
    if (req.query.role) {
      filters.role = req.query.role;
    }
    
    if (req.query.status) {
      filters.accountStatus = req.query.status;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    // Récupérer les utilisateurs avec pagination
    const users = await User.find(filters)
      .select('-refreshTokens -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compter le total pour la pagination
    const total = await User.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    // Statistiques rapides
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'active'] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          clientUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.getPublicProfile()),
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          clientUsers: 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Obtenir les détails complets d'un utilisateur
 * @access  Admin
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'ID est un ObjectId valide
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const user = await User.findById(userId)
      .select('-refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
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
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Modifier le statut d'un utilisateur
 * @access  Admin
 */
router.put('/users/:userId/status', [
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Le statut doit être active, inactive, suspended ou pending'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La raison ne peut pas dépasser 500 caractères')
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

    const { userId } = req.params;

    // Vérifier que l'ID est un ObjectId valide
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Vérifier que l'ID est un ObjectId valide
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    const { status, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la modification du statut de son propre compte
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier le statut de votre propre compte'
      });
    }

    const oldStatus = user.accountStatus;
    user.accountStatus = status;

    // Si l'utilisateur est suspendu, supprimer tous ses refresh tokens
    if (status === 'suspended' || status === 'inactive') {
      user.refreshTokens = [];
    }

    await user.save();

    // Log de l'action admin
    console.log(`🔧 Admin ${req.user.email} a changé le statut de ${user.email} de ${oldStatus} à ${status}${reason ? ` (Raison: ${reason})` : ''}`);

    res.json({
      success: true,
      message: `Statut de l'utilisateur mis à jour vers ${status}`,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId/role
 * @desc    Modifier le rôle d'un utilisateur
 * @access  Admin
 */
router.put('/users/:userId/role', [
  body('role')
    .isIn(['client', 'admin'])
    .withMessage('Le rôle doit être client ou admin')
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

    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la modification de son propre rôle
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log de l'action admin
    console.log(`🔧 Admin ${req.user.email} a changé le rôle de ${user.email} de ${oldRole} à ${role}`);

    res.json({
      success: true,
      message: `Rôle de l'utilisateur mis à jour vers ${role}`,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la modification du rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Créer un nouvel utilisateur
 * @access  Admin
 */
router.post('/users', [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ max: 50 })
    .withMessage('Le prénom ne peut pas dépasser 50 caractères'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role')
    .optional()
    .isIn(['client', 'admin'])
    .withMessage('Le rôle doit être client ou admin'),
  body('accountStatus')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Le statut doit être active, inactive, suspended ou pending'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ville ne peut pas dépasser 100 caractères'),
  body('address.postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne peut pas dépasser 20 caractères'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le pays ne peut pas dépasser 100 caractères'),
  body('tradingPreferences.riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Le niveau de risque doit être low, medium ou high'),
  body('tradingPreferences.preferredCurrencies')
    .optional()
    .isArray()
    .withMessage('Les devises préférées doivent être un tableau'),
  body('tradingPreferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('La notification email doit être un booléen'),
  body('tradingPreferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('La notification push doit être un booléen'),
  body('tradingPreferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('La notification SMS doit être un booléen'),
  // Nouveaux champs ajoutés
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le département ne peut pas dépasser 100 caractères'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le poste ne peut pas dépasser 100 caractères'),
  body('salary')
    .optional()
    .isNumeric()
    .custom((value) => value >= 0)
    .withMessage('Le salaire doit être un nombre positif'),
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Date d\'embauche invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Le statut actif doit être un booléen')
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

    const {
      firstName,
      lastName,
      email,
      password,
      role = 'client',
      accountStatus = 'active',
      phone,
      dateOfBirth,
      address,
      tradingPreferences
    } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer le nouvel utilisateur
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
      accountStatus,
      emailVerified: true // Les utilisateurs créés par admin sont automatiquement vérifiés
    };

    // Ajouter les champs optionnels s'ils sont fournis
    if (phone) userData.phone = phone;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (address) userData.address = address;
    if (tradingPreferences) userData.tradingPreferences = tradingPreferences;

    const user = new User(userData);
    await user.save();

    // Retourner l'utilisateur créé (sans le mot de passe)
    const userResponse = await User.findById(user._id)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Mettre à jour complètement un utilisateur
 * @access  Admin
 */
router.put('/users/:userId', [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le prénom ne peut pas être vide')
    .isLength({ max: 50 })
    .withMessage('Le prénom ne peut pas dépasser 50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le nom ne peut pas être vide')
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('role')
    .optional()
    .isIn(['client', 'admin'])
    .withMessage('Le rôle doit être client ou admin'),
  body('accountStatus')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Le statut doit être active, inactive, suspended ou pending'),
  body('phone')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true;
      return /^[\+]?[1-9][\d]{0,15}$/.test(value);
    })
    .withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true;
      return !isNaN(Date.parse(value));
    })
    .withMessage('Date de naissance invalide'),
  body('emailVerified')
    .optional()
    .isBoolean()
    .withMessage('La vérification email doit être un booléen'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ville ne peut pas dépasser 100 caractères'),
  body('address.postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne peut pas dépasser 20 caractères'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le pays ne peut pas dépasser 100 caractères'),
  body('tradingPreferences.riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Le niveau de risque doit être low, medium ou high'),
  body('tradingPreferences.preferredCurrencies')
    .optional()
    .isArray()
    .withMessage('Les devises préférées doivent être un tableau'),
  body('tradingPreferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('La notification email doit être un booléen'),
  body('tradingPreferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('La notification push doit être un booléen'),
  body('tradingPreferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('La notification SMS doit être un booléen'),
  // Nouveaux champs ajoutés
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le département ne peut pas dépasser 100 caractères'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le poste ne peut pas dépasser 100 caractères'),
  body('salary')
    .optional()
    .isNumeric()
    .custom((value) => value >= 0)
    .withMessage('Le salaire doit être un nombre positif'),
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Date d\'embauche invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Le statut actif doit être un booléen')
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

    const { userId } = req.params;

    // Vérifier que l'ID est un ObjectId valide
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const updateData = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }
    }

    // Traitement spécial pour les dates
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        select: '-password -refreshTokens -emailVerificationToken -passwordResetToken'
      }
    );

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Supprimer un utilisateur
 * @access  Admin
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'ID est un ObjectId valide
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await User.findByIdAndDelete(userId);

    // Log de l'action admin
    console.log(`🗑️ Admin ${req.user.email} a supprimé l'utilisateur ${user.email}`);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Obtenir les statistiques du dashboard admin
 * @access  Admin
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Statistiques générales
    const generalStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'active'] }, 1, 0] }
          },
          suspendedUsers: {
            $sum: { $cond: [{ $eq: ['$accountStatus', 'suspended'] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          clientUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] }
          }
        }
      }
    ]);

    // Statistiques par mois (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Utilisateurs récents (derniers 5)
    const recentUsers = await User.find()
      .select('firstName lastName email role accountStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Statistiques de connexion (dernière semaine)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const loginStats = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastLogin'
            }
          },
          activeUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        general: generalStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          adminUsers: 0,
          clientUsers: 0
        },
        monthly: monthlyStats,
        recent: recentUsers.map(user => user.getPublicProfile()),
        loginActivity: loginStats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @route   POST /api/admin/users/:userId/reset-password
 * @desc    Réinitialiser le mot de passe d'un utilisateur
 * @access  Admin
 */
router.post('/users/:userId/reset-password', async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'ID est un ObjectId valide
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    
    user.password = tempPassword;
    user.refreshTokens = []; // Supprimer tous les tokens existants
    await user.save();

    // Log de l'action admin
    console.log(`🔑 Admin ${req.user.email} a réinitialisé le mot de passe de ${user.email}`);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: {
        temporaryPassword: tempPassword,
        message: 'L\'utilisateur doit changer ce mot de passe lors de sa prochaine connexion'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;