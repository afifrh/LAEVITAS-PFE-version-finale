const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Créer un token de test
const testToken = jwt.sign(
  { userId: 'test-user', email: 'test@example.com' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🔑 Token de test généré:', testToken);

// Tester la connexion WebSocket
const wsUrl = `ws://localhost:5000/ws?token=${encodeURIComponent(testToken)}`;
console.log('🔌 Tentative de connexion à:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ Connexion WebSocket réussie !');
  
  // Envoyer un ping
  ws.send(JSON.stringify({
    type: 'ping'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Message reçu:', message);
});

ws.on('error', (error) => {
  console.error('❌ Erreur WebSocket:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Connexion fermée:', code, reason.toString());
  process.exit(0);
});

// Fermer après 5 secondes
setTimeout(() => {
  console.log('⏰ Test terminé');
  ws.close();
}, 5000);