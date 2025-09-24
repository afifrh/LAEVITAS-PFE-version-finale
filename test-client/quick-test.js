/**
 * Test rapide et interactif pour l'API Laevitas
 * 
 * Ce fichier permet de tester rapidement des fonctionnalités spécifiques
 * sans exécuter toute la suite de tests.
 */

const fetch = require('node-fetch');
global.fetch = fetch;

const LaevitasApiClient = require('./LaevitasApiClient');

// Créer le client
const client = new LaevitasApiClient('http://localhost:5000/api');

// Fonction utilitaire pour les tests rapides
async function quickTest() {
  console.log('🚀 Test rapide de l\'API Laevitas');
  console.log('================================\n');

  try {
    // 1. Vérifier la santé de l'API
    console.log('1️⃣ Test de santé de l\'API...');
    await client.healthCheck();
    console.log('✅ API opérationnelle\n');

    // 2. Connexion admin
    console.log('2️⃣ Connexion administrateur...');
    await client.login('admin@laevitas.com', 'Admin123!');
    console.log('✅ Connexion admin réussie');
    client.showUserInfo();
    console.log('');

    // 3. Obtenir la liste des utilisateurs
    console.log('3️⃣ Récupération des utilisateurs...');
    const usersResponse = await client.getAllUsers({ limit: 5 });
    console.log(`✅ ${usersResponse.data.pagination.totalUsers} utilisateurs trouvés`);
    
    // Afficher les premiers utilisateurs
    usersResponse.data.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // 4. Statistiques
    console.log('4️⃣ Statistiques des utilisateurs:');
    const stats = usersResponse.data.stats;
    console.log(`   📊 Total: ${stats.totalUsers}`);
    console.log(`   ✅ Actifs: ${stats.activeUsers}`);
    console.log(`   👑 Admins: ${stats.adminUsers}`);
    console.log(`   👤 Clients: ${stats.clientUsers}`);
    console.log('');

    // 5. Test de création d'utilisateur
    console.log('5️⃣ Test de création d\'utilisateur...');
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123'
    };

    // Se déconnecter pour s'inscrire
    await client.logout();
    
    try {
      await client.register(newUser);
      console.log('✅ Nouvel utilisateur créé avec succès');
      client.showUserInfo();
    } catch (error) {
      console.log('ℹ️ Utilisateur déjà existant ou erreur:', error.message);
    }

    console.log('\n🎉 Test rapide terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test rapide:', error.message);
  }
}

// Fonction pour tester une fonctionnalité spécifique
async function testSpecificFeature() {
  console.log('🔧 Test de fonctionnalité spécifique');
  console.log('===================================\n');

  try {
    // Connexion admin
    await client.login('admin@laevitas.com', 'Admin123!');
    
    // Exemple : Rechercher un utilisateur spécifique
    const searchResults = await client.getAllUsers({
      search: 'admin',
      limit: 10
    });
    
    console.log('🔍 Résultats de recherche pour "admin":');
    searchResults.data.users.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Fonction pour tester les tokens
async function testTokens() {
  console.log('🔑 Test de gestion des tokens');
  console.log('=============================\n');

  try {
    // Connexion
    await client.login('admin@laevitas.com', 'Admin123!');
    console.log('✅ Connexion réussie');

    // Vérifier le token
    await client.verifyToken();
    console.log('✅ Token valide');

    // Rafraîchir le token
    await client.refreshAccessToken();
    console.log('✅ Token rafraîchi');

    // Vérifier à nouveau
    await client.verifyToken();
    console.log('✅ Nouveau token valide');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Menu interactif
function showMenu() {
  console.log('\n📋 Menu des tests rapides:');
  console.log('1. Test complet rapide');
  console.log('2. Test de fonctionnalité spécifique');
  console.log('3. Test de gestion des tokens');
  console.log('4. Afficher les capacités du client');
  console.log('5. Quitter');
  console.log('\nUtilisation: node quick-test.js [1-5]');
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const choice = args[0];

async function main() {
  if (!choice) {
    showMenu();
    return;
  }

  switch (choice) {
    case '1':
      await quickTest();
      break;
    case '2':
      await testSpecificFeature();
      break;
    case '3':
      await testTokens();
      break;
    case '4':
      client.showCapabilities();
      break;
    case '5':
      console.log('👋 Au revoir !');
      break;
    default:
      console.log('❌ Option invalide');
      showMenu();
  }
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  client,
  quickTest,
  testSpecificFeature,
  testTokens
};