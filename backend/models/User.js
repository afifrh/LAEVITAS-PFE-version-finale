const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez entrer un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe dans les requêtes par défaut
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: String
  },
  tradingPreferences: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    preferredCurrencies: [{
      type: String,
      uppercase: true
    }],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 jours
    }
  }],
  // Champs supplémentaires pour le dashboard admin
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Le département ne peut pas dépasser 100 caractères']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Le poste ne peut pas dépasser 100 caractères']
  },
  salary: {
    type: Number,
    min: [0, 'Le salaire ne peut pas être négatif']
  },
  hireDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  profileCompleteness: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

// Virtual pour le nom complet
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual pour vérifier si le compte est verrouillé
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();

  try {
    // Hasher le mot de passe avec un coût de 12
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware pour calculer automatiquement le pourcentage de complétude du profil
userSchema.pre('save', function(next) {
  // Calculer et mettre à jour le pourcentage de complétude
  this.profileCompleteness = this.calculateProfileCompleteness();
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe');
  }
};

// Méthode pour incrémenter les tentatives de connexion
userSchema.methods.incLoginAttempts = function() {
  // Si nous avons une date de verrouillage précédente et qu'elle est expirée, redémarrer à 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Si nous atteignons le maximum de tentatives et qu'il n'y a pas de verrouillage, verrouiller le compte
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Verrouiller pendant 2 heures
  }
  
  return this.updateOne(updates);
};

// Méthode pour réinitialiser les tentatives de connexion
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Méthode pour calculer le pourcentage de complétude du profil
userSchema.methods.calculateProfileCompleteness = function() {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
    'address.street', 'address.city', 'address.postalCode', 'address.country'
  ];
  
  const optionalFields = [
    'avatar', 'department', 'position', 'tradingPreferences.riskLevel'
  ];
  
  let completedRequired = 0;
  let completedOptional = 0;
  
  // Vérifier les champs requis
  requiredFields.forEach(field => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj && obj[key], this) : 
      this[field];
    if (value && value.toString().trim() !== '') {
      completedRequired++;
    }
  });
  
  // Vérifier les champs optionnels
  optionalFields.forEach(field => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj && obj[key], this) : 
      this[field];
    if (value && value.toString().trim() !== '') {
      completedOptional++;
    }
  });
  
  // Calculer le pourcentage (70% pour les champs requis, 30% pour les optionnels)
  const requiredPercentage = (completedRequired / requiredFields.length) * 70;
  const optionalPercentage = (completedOptional / optionalFields.length) * 30;
  
  return Math.round(requiredPercentage + optionalPercentage);
};

// Méthode pour obtenir les données publiques de l'utilisateur
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Supprimer les champs sensibles
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  
  return userObject;
};

// Méthode statique pour trouver un utilisateur par email avec le mot de passe
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }
  
  if (user.isLocked) {
    throw new Error('Compte temporairement verrouillé en raison de trop nombreuses tentatives de connexion');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Email ou mot de passe incorrect');
  }
  
  // Réinitialiser les tentatives de connexion en cas de succès
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Mettre à jour la dernière connexion
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

module.exports = mongoose.model('User', userSchema);