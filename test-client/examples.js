/**
 * Exemples d'utilisation du client de test Laevitas API
 * 
 * Ce fichier contient des exemples pratiques pour tester toutes les fonctionnalités
 * de l'API Laevitas Trading Platform.
 * 
 * Pour utiliser ces exemples:
 * 1. Assurez-vous que le serveur backend est démarré (npm run dev dans /backend)
 * 2. Installez node-fetch si nécessaire: npm install node-fetch
 * 3. Exécutez: node examples.js
 */

// Import du client (nécessite node-fetch pour Node.js)
const fetch = require('node-fetch');
global.fetch = fetch;

const LaevitasApiClient = require('./LaevitasApiClient');

// Créer une instance du client
const client = new LaevitasApiClient('http://localhost:5000/api');

// Données de test
const testUsers = {
  client: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@test.com',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123',
    phone: '+33123456789'
  },
  admin: {
    email: 'admin@laevitas.com',
    password: 'Admin123!'
  }
};

/**
 * Utilitaire pour attendre un délai
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utilitaire pour afficher une section
 */
const showSection = (title) => {
  console.log('\n' + '='.repeat(60));
  console.log(`🔸 ${title}`);
  console.log('='.repeat(60));
};

/**
 * Utilitaire pour gérer les erreurs
 */
const handleError = (error, context) => {
  console.error(`❌ Erreur dans ${context}:`, error.message);
  return false;
};

/**
 * Test 1: Vérification de la santé de l'API
 */
async function testHealthCheck() {
  showSection('TEST 1: Vérification de la santé de l\'API');
  
  try {
    const response = await client.healthCheck();
    console.log('✅ API opérationnelle');
    return true;
  } catch (error) {
    return handleError(error, 'health check');
  }
}

/**
 * Test 2: Inscription d'un nouvel utilisateur
 */
async function testUserRegistration() {
  showSection('TEST 2: Inscription d\'un nouvel utilisateur');
  
  try {
    const response = await client.register(testUsers.client);
    console.log('✅ Inscription réussie');
    client.showUserInfo();
    return true;
  } catch (error) {
    return handleError(error, 'inscription');
  }
}

/**
 * Test 3: Connexion utilisateur
 */
async function testUserLogin() {
  showSection('TEST 3: Connexion utilisateur');
  
  try {
    // Se déconnecter d'abord
    client.clearTokens();
    
    const response = await client.login(testUsers.client.email, testUsers.client.password);
    console.log('✅ Connexion réussie');
    client.showUserInfo();
    return true;
  } catch (error) {
    return handleError(error, 'connexion');
  }
}

/**
 * Test 4: Gestion du profil utilisateur
 */
async function testUserProfile() {
  showSection('TEST 4: Gestion du profil utilisateur');
  
  try {
    // Obtenir le profil actuel
    await client.getMe();
    console.log('✅ Profil récupéré');
    
    // Mettre à jour le profil
    const updateData = {
      firstName: 'Jean-Michel',
      phone: '+33987654321'
    };
    
    await client.updateProfile(updateData);
    console.log('✅ Profil mis à jour');
    client.showUserInfo();
    
    return true;
  } catch (error) {
    return handleError(error, 'gestion du profil');
  }
}

/**
 * Test 5: Changement de mot de passe
 */
async function testPasswordChange() {
  showSection('TEST 5: Changement de mot de passe');
  
  try {
    const newPassword = 'NewPassword123';
    
    await client.changePassword(
      testUsers.client.password,
      newPassword,
      newPassword
    );
    
    console.log('✅ Mot de passe changé');
    
    // Mettre à jour le mot de passe de test
    testUsers.client.password = newPassword;
    
    return true;
  } catch (error) {
    return handleError(error, 'changement de mot de passe');
  }
}

/**
 * Test 6: Connexion administrateur
 */
async function testAdminLogin() {
  showSection('TEST 6: Connexion administrateur');
  
  try {
    // Se déconnecter du compte client
    await client.logout();
    
    // Se connecter en tant qu'admin
    await client.login(testUsers.admin.email, testUsers.admin.password);
    console.log('✅ Connexion admin réussie');
    client.showUserInfo();
    
    return true;
  } catch (error) {
    return handleError(error, 'connexion admin');
  }
}

/**
 * Test 7: Fonctions d'administration
 */
async function testAdminFunctions() {
  showSection('TEST 7: Fonctions d\'administration');
  
  try {
    // Obtenir la liste des utilisateurs
    const usersResponse = await client.getAllUsers({
      page: 1,
      limit: 10
    });
    console.log(`✅ ${usersResponse.data.pagination.totalUsers} utilisateurs trouvés`);
    
    // Trouver l'utilisateur de test
    const testUser = usersResponse.data.users.find(
      user => user.email === testUsers.client.email
    );
    
    if (testUser) {
      console.log(`📋 Utilisateur de test trouvé: ${testUser._id}`);
      
      // Obtenir les détails de l'utilisateur
      await client.getAdminUser(testUser._id);
      console.log('✅ Détails utilisateur récupérés');
      
      // Tester la modification du statut
      await client.updateUserStatus(testUser._id, 'suspended', 'Test de suspension');
      console.log('✅ Statut utilisateur modifié');
      
      // Remettre le statut actif
      await client.updateUserStatus(testUser._id, 'active', 'Test terminé');
      console.log('✅ Statut utilisateur restauré');
    }
    
    return true;
  } catch (error) {
    return handleError(error, 'fonctions admin');
  }
}

/**
 * Test 8: Gestion des tokens
 */
async function testTokenManagement() {
  showSection('TEST 8: Gestion des tokens');
  
  try {
    // Vérifier le token actuel
    await client.verifyToken();
    console.log('✅ Token valide');
    
    // Tester le rafraîchissement du token
    await client.refreshAccessToken();
    console.log('✅ Token rafraîchi');
    
    return true;
  } catch (error) {
    return handleError(error, 'gestion des tokens');
  }
}

/**
 * Test 9: Déconnexion
 */
async function testLogout() {
  showSection('TEST 9: Déconnexion');
  
  try {
    await client.logout();
    console.log('✅ Déconnexion réussie');
    console.log(`🔓 Authentifié: ${client.isAuthenticated()}`);
    
    return true;
  } catch (error) {
    return handleError(error, 'déconnexion');
  }
}

/**
 * Fonction principale pour exécuter tous les tests
 */
async function runAllTests() {
  console.log('🚀 Démarrage des tests du client Laevitas API');
  console.log('📡 URL de l\'API:', client.baseUrl);
  
  // Afficher les capacités du client
  client.showCapabilities();
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Inscription', fn: testUserRegistration },
    { name: 'Connexion', fn: testUserLogin },
    { name: 'Profil utilisateur', fn: testUserProfile },
    { name: 'Changement mot de passe', fn: testPasswordChange },
    { name: 'Connexion admin', fn: testAdminLogin },
    { name: 'Fonctions admin', fn: testAdminFunctions },
    { name: 'Gestion tokens', fn: testTokenManagement },
    { name: 'Déconnexion', fn: testLogout }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name}: RÉUSSI`);
      } else {
        failed++;
        console.log(`❌ ${test.name}: ÉCHOUÉ`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name}: ERREUR -`, error.message);
    }
    
    // Attendre un peu entre les tests
    await sleep(1000);
  }
  
  // Résumé final
  showSection('RÉSUMÉ DES TESTS');
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(`🎯 Taux de réussite: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 Tous les tests sont passés avec succès !');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
}

/**
 * Tests individuels pour développement
 */
async function runIndividualTests() {
  showSection('TESTS INDIVIDUELS');
  
  console.log('Vous pouvez exécuter des tests individuels:');
  console.log('- testHealthCheck()');
  console.log('- testUserRegistration()');
  console.log('- testUserLogin()');
  console.log('- testAdminLogin()');
  console.log('- etc.');
  
  // Exemple d'utilisation individuelle
  try {
    await testHealthCheck();
    
    // Connexion admin pour les tests
    await client.login(testUsers.admin.email, testUsers.admin.password);
    client.showUserInfo();
    
    // Test de récupération des utilisateurs
    const users = await client.getAllUsers({ limit: 5 });
    console.log(`📋 ${users.data.pagination.totalUsers} utilisateurs dans la base`);
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

// Exécution des tests
if (require.main === module) {
  // Si le fichier est exécuté directement
  const args = process.argv.slice(2);
  
  if (args.includes('--individual')) {
    runIndividualTests();
  } else {
    runAllTests();
  }
}

// Export des fonctions pour utilisation externe
module.exports = {
  LaevitasApiClient,
  client,
  testUsers,
  runAllTests,
  runIndividualTests,
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testAdminLogin,
  testUserProfile,
  testPasswordChange,
  testAdminFunctions,
  testTokenManagement,
  testLogout
};