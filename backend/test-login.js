const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Test de connexion avec le nouveau mot de passe...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'afif99benrhouma@gmail.com',
      password: 'NouveauMotDePasse123!'
    });
    
    console.log('✅ Connexion réussie !');
    console.log('👤 Utilisateur:', loginResponse.data.data.user.email);
    console.log('🎯 Rôle:', loginResponse.data.data.user.role);
    console.log('🔑 Token reçu:', loginResponse.data.data.tokens.accessToken ? 'Oui' : 'Non');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
  }
}

testLogin();