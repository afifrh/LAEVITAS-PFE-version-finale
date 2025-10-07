const nodemailer = require('nodemailer');

async function createEtherealAccount() {
  try {
    console.log('🔧 Création d\'un compte Ethereal Email pour les tests...');
    
    // Créer un compte de test Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Compte Ethereal créé avec succès !');
    console.log('📧 Informations du compte:');
    console.log(`   Host: ${testAccount.smtp.host}`);
    console.log(`   Port: ${testAccount.smtp.port}`);
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    
    console.log('\n📝 Ajoutez ces variables à votre fichier .env:');
    console.log(`EMAIL_HOST=${testAccount.smtp.host}`);
    console.log(`EMAIL_PORT=${testAccount.smtp.port}`);
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASS=${testAccount.pass}`);
    
    // Test d'envoi d'email
    console.log('\n🧪 Test d\'envoi d\'email...');
    
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    const info = await transporter.sendMail({
      from: '"Laevitas Support" <noreply@laevitas.com>',
      to: 'afif99benrhouma@gmail.com',
      subject: 'Test - Réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test d'envoi d'email</h2>
          <p>Ceci est un test d'envoi d'email depuis Laevitas.</p>
          <p>Si vous recevez cet email, la configuration fonctionne !</p>
        </div>
      `
    });
    
    console.log('✅ Email envoyé avec succès !');
    console.log('📧 Message ID:', info.messageId);
    console.log('🔗 Aperçu de l\'email:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createEtherealAccount();