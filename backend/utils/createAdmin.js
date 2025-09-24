const User = require('../models/User');

/**
 * Crée un utilisateur administrateur par défaut si aucun admin n'existe
 */
const createDefaultAdmin = async () => {
  try {
    // Vérifier s'il existe déjà un administrateur
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Un administrateur existe déjà');
      return;
    }

    // Créer l'administrateur par défaut
    const adminData = {
      firstName: 'Admin',
      lastName: 'Laevitas',
      email: process.env.ADMIN_EMAIL || 'admin@laevitas.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
      emailVerified: true,
      accountStatus: 'active',
      tradingPreferences: {
        riskLevel: 'high',
        preferredCurrencies: ['BTC', 'ETH', 'USDT', 'BNB'],
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Administrateur par défaut créé avec succès');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Mot de passe: ${adminData.password}`);
    console.log('⚠️  Veuillez changer le mot de passe par défaut après la première connexion');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur par défaut:', error.message);
    
    // Si l'erreur est due à un email déjà existant, ce n'est pas grave
    if (error.code === 11000) {
      console.log('ℹ️  Un utilisateur avec cet email existe déjà');
      return;
    }
    
    // Pour les autres erreurs, on peut continuer mais on log l'erreur
    console.error('Détails de l\'erreur:', error);
  }
};

/**
 * Crée des utilisateurs de test pour le développement
 */
const createTestUsers = async () => {
  // Ne créer des utilisateurs de test qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // Vérifier s'il existe déjà des utilisateurs de test
    const existingTestUser = await User.findOne({ email: 'client@test.com' });
    
    if (existingTestUser) {
      console.log('✅ Les utilisateurs de test existent déjà');
      return;
    }

    // Créer un client de test
    const testClient = new User({
      firstName: 'Client',
      lastName: 'Test',
      email: 'client@test.com',
      password: 'Client123!',
      role: 'client',
      emailVerified: true,
      accountStatus: 'active',
      phone: '+33123456789',
      dateOfBirth: new Date('1990-01-01'),
      address: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      tradingPreferences: {
        riskLevel: 'medium',
        preferredCurrencies: ['BTC', 'ETH'],
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    });

    await testClient.save();

    // Créer un autre client de test
    const testClient2 = new User({
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'marie.dupont@test.com',
      password: 'Marie123!',
      role: 'client',
      emailVerified: true,
      accountStatus: 'active',
      phone: '+33987654321',
      dateOfBirth: new Date('1985-05-15'),
      address: {
        street: '456 Avenue des Champs',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France'
      },
      tradingPreferences: {
        riskLevel: 'low',
        preferredCurrencies: ['USDT', 'BTC'],
        notifications: {
          email: true,
          push: false,
          sms: true
        }
      }
    });

    await testClient2.save();

    console.log('✅ Utilisateurs de test créés avec succès');
    console.log('📧 Client 1: client@test.com / Client123!');
    console.log('📧 Client 2: marie.dupont@test.com / Marie123!');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', error.message);
  }
};

/**
 * Fonction principale pour initialiser les utilisateurs par défaut
 */
const initializeDefaultUsers = async () => {
  console.log('🔄 Initialisation des utilisateurs par défaut...');
  
  await createDefaultAdmin();
  await createTestUsers();
  
  console.log('✅ Initialisation des utilisateurs terminée');
};

module.exports = initializeDefaultUsers;