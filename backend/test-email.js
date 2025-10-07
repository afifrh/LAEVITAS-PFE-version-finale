const axios = require('axios');

async function testCompletePasswordReset() {
  try {
    console.log('🧪 Test complet de la fonctionnalité "Mot de passe oublié"...');
    
    const email = 'afif99benrhouma@gmail.com';
    
    // 1. Test de la demande de réinitialisation
    console.log('\n📧 1. Test de demande de réinitialisation...');
    const forgotResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: email
    });
    
    console.log('✅ Réponse:', forgotResponse.data);
    
    // 2. Simulation d'un token de réinitialisation (normalement reçu par email)
    console.log('\n🔑 2. Test avec un token de réinitialisation...');
    
    // Pour les tests, nous allons créer un token directement
    const crypto = require('crypto');
    const mongoose = require('mongoose');
    const User = require('./models/User');
    require('dotenv').config();
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laevitas-trading');
    
    // Générer un token de test
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Mettre à jour l'utilisateur avec le token
    await User.findOneAndUpdate(
      { email: email },
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
      }
    );
    
    console.log('✅ Token de test généré:', resetToken.substring(0, 10) + '...');
    
    // 3. Test de réinitialisation du mot de passe
    console.log('\n🔒 3. Test de réinitialisation du mot de passe...');
    
    const resetResponse = await axios.post('http://localhost:5000/api/auth/reset-password', {
      token: resetToken,
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'NouveauMotDePasse123!'
    });
    
    console.log('✅ Réponse de réinitialisation:', resetResponse.data);
    
    // 4. Test de connexion avec le nouveau mot de passe
    console.log('\n🔐 4. Test de connexion avec le nouveau mot de passe...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      password: 'NouveauMotDePasse123!'
    });
    
    console.log('✅ Connexion réussie:', {
      success: loginResponse.data.success,
      user: loginResponse.data.user.email
    });
    
    await mongoose.disconnect();
    console.log('\n🎉 Test complet réussi ! La fonctionnalité fonctionne parfaitement.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

testCompletePasswordReset();