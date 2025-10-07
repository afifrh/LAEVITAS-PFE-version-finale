require('dotenv').config();
const jwt = require('jsonwebtoken');

// Générer un token de test valide
function generateTestToken() {
  const payload = {
    userId: '676a1234567890abcdef1234',
    email: 'test@example.com',
    role: 'client'
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: 'laevitas-trading',
      audience: 'laevitas-users'
    }
  );

  console.log('🔑 Token de test généré:');
  console.log(token);
  console.log('\n📋 Payload:');
  console.log(payload);
  console.log('\n⏰ Expiration: 1 heure');
  
  return token;
}

// Vérifier le token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'laevitas-trading',
      audience: 'laevitas-users'
    });
    
    console.log('\n✅ Token valide');
    console.log('📋 Données décodées:', decoded);
    return true;
  } catch (error) {
    console.log('\n❌ Token invalide:', error.message);
    return false;
  }
}

// Exécuter
console.log('🧪 Génération d\'un token de test...\n');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET non défini dans les variables d\'environnement');
  process.exit(1);
}

const token = generateTestToken();
verifyToken(token);