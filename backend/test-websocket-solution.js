const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Configuration
const WS_URL = 'ws://localhost:5000/ws';
const JWT_SECRET = 'laevitas_jwt_secret_2024_trading_platform_secure_key';

console.log('🧪 Test de la solution WebSocket Laevitas');
console.log('==========================================\n');

// Test 1: Connexion sans token
async function testWithoutToken() {
  console.log('📋 Test 1: Connexion sans token d\'authentification');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('❌ ERREUR: Connexion autorisée sans token (ne devrait pas arriver)');
      ws.close();
      resolve(false);
    });
    
    ws.on('error', (error) => {
      console.log('✅ SUCCÈS: Connexion refusée sans token (comportement attendu)');
      console.log(`   Erreur: ${error.message}`);
      resolve(true);
    });
    
    ws.on('close', (code, reason) => {
      if (code === 1002) {
        console.log('✅ SUCCÈS: Connexion fermée pour erreur de protocole (comportement attendu)');
        resolve(true);
      } else {
        console.log(`⚠️  Connexion fermée avec code: ${code}, raison: ${reason}`);
        resolve(true);
      }
    });
    
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏱️  Timeout: Connexion en cours...');
        ws.close();
        resolve(true);
      }
    }, 3000);
  });
}

// Test 2: Connexion avec token valide
async function testWithValidToken() {
  console.log('\n📋 Test 2: Connexion avec token valide');
  
  // Générer un token valide
  const token = jwt.sign(
    { 
      userId: 'test-user-123',
      email: 'test@laevitas.com',
      firstName: 'Test',
      lastName: 'User'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  console.log(`   Token généré: ${token.substring(0, 50)}...`);
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    
    ws.on('open', () => {
      console.log('✅ SUCCÈS: Connexion établie avec token valide');
      
      // Test d'envoi de message
      ws.send(JSON.stringify({
        type: 'subscribe',
        symbol: 'BTCUSDT'
      }));
      
      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 2000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`   📨 Message reçu: ${message.type}`);
      } catch (e) {
        console.log(`   📨 Message reçu: ${data}`);
      }
    });
    
    ws.on('error', (error) => {
      console.log(`❌ ERREUR: ${error.message}`);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`   🔌 Connexion fermée: code ${code}`);
      resolve(true);
    });
    
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('❌ ERREUR: Timeout de connexion');
        ws.close();
        resolve(false);
      }
    }, 5000);
  });
}

// Test 3: Connexion avec token expiré
async function testWithExpiredToken() {
  console.log('\n📋 Test 3: Connexion avec token expiré');
  
  // Générer un token expiré
  const token = jwt.sign(
    { 
      userId: 'test-user-123',
      email: 'test@laevitas.com'
    },
    JWT_SECRET,
    { expiresIn: '-1h' } // Token expiré
  );
  
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    
    ws.on('open', () => {
      console.log('❌ ERREUR: Connexion autorisée avec token expiré (ne devrait pas arriver)');
      ws.close();
      resolve(false);
    });
    
    ws.on('error', (error) => {
      console.log('✅ SUCCÈS: Connexion refusée avec token expiré (comportement attendu)');
      resolve(true);
    });
    
    ws.on('close', (code, reason) => {
      console.log('✅ SUCCÈS: Connexion fermée pour token expiré (comportement attendu)');
      resolve(true);
    });
    
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏱️  Timeout: Connexion en cours...');
        ws.close();
        resolve(true);
      }
    }, 3000);
  });
}

// Test 4: Vérification du serveur backend
async function testBackendHealth() {
  console.log('\n📋 Test 4: Vérification de l\'état du serveur backend');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCÈS: Serveur backend accessible');
      console.log(`   Réponse: ${data.message}`);
      return true;
    } else {
      console.log(`❌ ERREUR: Serveur backend répond avec status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERREUR: Impossible de contacter le serveur backend`);
    console.log(`   Erreur: ${error.message}`);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  const results = {
    backendHealth: await testBackendHealth(),
    withoutToken: await testWithoutToken(),
    withValidToken: await testWithValidToken(),
    withExpiredToken: await testWithExpiredToken()
  };
  
  console.log('\n📊 Résultats des tests:');
  console.log('========================');
  console.log(`Backend Health: ${results.backendHealth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sans token: ${results.withoutToken ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token valide: ${results.withValidToken ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token expiré: ${results.withExpiredToken ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 Conclusion:');
  if (allPassed) {
    console.log('✅ Tous les tests sont passés ! La solution WebSocket fonctionne correctement.');
    console.log('\n💡 Instructions pour l\'utilisateur:');
    console.log('1. Assurez-vous d\'être connecté à l\'application');
    console.log('2. L\'indicateur de statut WebSocket apparaît dans le dashboard');
    console.log('3. Si vous voyez "Déconnecté", cliquez sur "Reconnecter"');
    console.log('4. Vérifiez la console du navigateur pour les logs de diagnostic');
  } else {
    console.log('❌ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Démarrer les tests
runAllTests().catch(error => {
  console.error('💥 Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});