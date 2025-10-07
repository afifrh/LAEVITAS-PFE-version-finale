const User = require('../models/User');
const Wallet = require('../models/Wallet');

/**
 * Crée des portefeuilles de test avec des soldes pour les utilisateurs de test
 */
const createTestWallets = async () => {
  try {
    console.log('🔄 Initialisation des portefeuilles de test...');

    // Trouver les utilisateurs de test
    const testUsers = await User.find({ 
      email: { $in: ['client@test.com', 'marie.dupont@test.com', 'admin@laevitas.com'] }
    });

    if (testUsers.length === 0) {
      console.log('⚠️  Aucun utilisateur de test trouvé. Créez d\'abord les utilisateurs de test.');
      return;
    }

    for (const user of testUsers) {
      // Vérifier si le portefeuille existe déjà
      let wallet = await Wallet.findByUserId(user._id);
      
      if (wallet) {
        console.log(`✅ Portefeuille existe déjà pour ${user.email}`);
        continue;
      }

      // Créer le portefeuille avec des soldes de test
      const testBalances = [
        { currency: 'USD', available: 5000, locked: 0, total: 5000 },
        { currency: 'EUR', available: 3000, locked: 200, total: 3200 },
        { currency: 'BTC', available: 0.5, locked: 0.1, total: 0.6 },
        { currency: 'ETH', available: 2.5, locked: 0.5, total: 3.0 },
        { currency: 'USDT', available: 1000, locked: 0, total: 1000 },
        { currency: 'BNB', available: 10, locked: 2, total: 12 }
      ];

      // Ajuster les soldes selon le type d'utilisateur
      if (user.email === 'admin@laevitas.com') {
        // Admin a plus de fonds
        testBalances.forEach(balance => {
          balance.available *= 10;
          balance.locked *= 10;
          balance.total *= 10;
        });
      } else if (user.email === 'marie.dupont@test.com') {
        // Marie a des soldes plus modestes
        testBalances.forEach(balance => {
          balance.available *= 0.3;
          balance.locked *= 0.3;
          balance.total *= 0.3;
        });
      }

      wallet = new Wallet({
        userId: user._id,
        balances: testBalances,
        transactions: [
          {
            type: 'deposit',
            currency: 'USD',
            amount: testBalances.find(b => b.currency === 'USD').available,
            status: 'completed',
            method: 'bank_transfer',
            metadata: {
              bankAccount: {
                iban: 'FR1420041010050500013M02606',
                bic: 'CCBPFRPPXXX',
                accountHolder: user.firstName + ' ' + user.lastName
              },
              notes: 'Dépôt initial de test'
            },
            processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'deposit',
            currency: 'BTC',
            amount: testBalances.find(b => b.currency === 'BTC').available,
            status: 'completed',
            method: 'crypto_wallet',
            metadata: {
              cryptoWallet: {
                address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                network: 'Bitcoin',
                txHash: '0x' + Math.random().toString(16).substr(2, 64)
              },
              notes: 'Dépôt Bitcoin de test'
            },
            processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'withdrawal',
            currency: 'EUR',
            amount: 500,
            status: 'completed',
            method: 'bank_transfer',
            fees: {
              amount: 5,
              currency: 'EUR'
            },
            metadata: {
              bankAccount: {
                iban: 'FR1420041010050500013M02606',
                bic: 'CCBPFRPPXXX',
                accountHolder: user.firstName + ' ' + user.lastName
              },
              notes: 'Retrait de test'
            },
            processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        settings: {
          defaultCurrency: 'USD',
          autoConvert: false,
          notifications: {
            deposits: true,
            withdrawals: true,
            lowBalance: true,
            threshold: 100
          }
        },
        verification: {
          level: user.email === 'admin@laevitas.com' ? 3 : 2,
          limits: {
            dailyDeposit: user.email === 'admin@laevitas.com' ? 100000 : 5000,
            dailyWithdrawal: user.email === 'admin@laevitas.com' ? 50000 : 2000,
            monthlyDeposit: user.email === 'admin@laevitas.com' ? 1000000 : 50000,
            monthlyWithdrawal: user.email === 'admin@laevitas.com' ? 500000 : 20000
          }
        }
      });

      await wallet.save();
      console.log(`✅ Portefeuille créé pour ${user.email} avec des soldes de test`);
      console.log(`   💰 USD: ${testBalances.find(b => b.currency === 'USD').total}`);
      console.log(`   💰 BTC: ${testBalances.find(b => b.currency === 'BTC').total}`);
      console.log(`   💰 ETH: ${testBalances.find(b => b.currency === 'ETH').total}`);
    }

    console.log('✅ Initialisation des portefeuilles de test terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la création des portefeuilles de test:', error);
  }
};

/**
 * Réinitialise les portefeuilles de test (supprime et recrée)
 */
const resetTestWallets = async () => {
  try {
    console.log('🔄 Réinitialisation des portefeuilles de test...');

    // Trouver les utilisateurs de test
    const testUsers = await User.find({ 
      email: { $in: ['client@test.com', 'marie.dupont@test.com', 'admin@laevitas.com'] }
    });

    // Supprimer les portefeuilles existants
    for (const user of testUsers) {
      await Wallet.deleteOne({ userId: user._id });
      console.log(`🗑️  Portefeuille supprimé pour ${user.email}`);
    }

    // Recréer les portefeuilles
    await createTestWallets();

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation des portefeuilles:', error);
  }
};

/**
 * Fonction principale
 */
const seedWallets = async () => {
  // Ne créer des portefeuilles de test qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    console.log('ℹ️  Les portefeuilles de test ne sont créés qu\'en mode développement');
    return;
  }

  await createTestWallets();
};

// Si le script est exécuté directement
if (require.main === module) {
  const mongoose = require('mongoose');
  
  // Connexion à la base de données
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laevitas-crypto', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.once('open', async () => {
    console.log('📊 Connexion à MongoDB établie');
    
    // Vérifier les arguments de ligne de commande
    const args = process.argv.slice(2);
    if (args.includes('--reset')) {
      await resetTestWallets();
    } else {
      await seedWallets();
    }
    
    mongoose.connection.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  });
}

module.exports = { seedWallets, createTestWallets, resetTestWallets };