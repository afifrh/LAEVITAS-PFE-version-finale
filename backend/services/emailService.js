const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Recharger les variables d'environnement
    require('dotenv').config();
    
    // Configuration pour un service d'email (Gmail, SendGrid, etc.)
    // Pour le développement, nous utilisons Ethereal Email (service de test)
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass',
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('📧 Configuration email:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 10) + '...' : 'non défini'
    });

    // Pour la production, utilisez un vrai service d'email comme Gmail:
    /*
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Utilisez un mot de passe d'application
      }
    });
    */
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Laevitas Support" <${process.env.EMAIL_FROM || 'noreply@laevitas.com'}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe - Laevitas',
        html: this.getPasswordResetTemplate(firstName, resetUrl, resetToken)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email de récupération envoyé:', info.messageId);
      
      // Pour le développement avec Ethereal, afficher l'URL de prévisualisation
      if (process.env.NODE_ENV !== 'production') {
        console.log('URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email de récupération');
    }
  }

  getPasswordResetTemplate(firstName, resetUrl, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - Laevitas</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #3b82f6;
                margin-bottom: 10px;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content {
                color: #4b5563;
                margin-bottom: 30px;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
            }
            .reset-button:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            }
            .token-info {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-family: monospace;
                font-size: 14px;
                word-break: break-all;
            }
            .warning {
                background: #fef3cd;
                border: 1px solid #fbbf24;
                color: #92400e;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚡ LAEVITAS</div>
                <h1 class="title">Réinitialisation de votre mot de passe</h1>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${firstName}</strong>,</p>
                
                <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Laevitas.</p>
                
                <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">
                        🔐 Réinitialiser mon mot de passe
                    </a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important :</strong>
                    <ul>
                        <li>Ce lien est valide pendant <strong>1 heure</strong> seulement</li>
                        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                        <li>Ne partagez jamais ce lien avec personne</li>
                    </ul>
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
                <div class="token-info">
                    ${resetUrl}
                </div>
                
                <p>Si vous rencontrez des difficultés, n'hésitez pas à contacter notre support à <a href="mailto:support@laevitas.com">support@laevitas.com</a></p>
            </div>
            
            <div class="footer">
                <p>© 2024 Laevitas - Plateforme de Trading Crypto</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendPasswordResetConfirmation(email, firstName) {
    try {
      const mailOptions = {
        from: `"Laevitas Support" <${process.env.EMAIL_FROM || 'noreply@laevitas.com'}>`,
        to: email,
        subject: 'Mot de passe modifié avec succès - Laevitas',
        html: this.getPasswordResetConfirmationTemplate(firstName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de confirmation envoyé:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
      return { success: false, error: error.message };
    }
  }

  getPasswordResetConfirmationTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mot de passe modifié - Laevitas</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #10b981;
                margin-bottom: 10px;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .success-icon {
                font-size: 48px;
                color: #10b981;
                margin-bottom: 20px;
            }
            .content {
                color: #4b5563;
                margin-bottom: 30px;
            }
            .info-box {
                background: #ecfdf5;
                border: 1px solid #10b981;
                color: #065f46;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚡ LAEVITAS</div>
                <div class="success-icon">✅</div>
                <h1 class="title">Mot de passe modifié avec succès</h1>
            </div>
            
            <div class="content">
                <p>Bonjour <strong>${firstName}</strong>,</p>
                
                <p>Votre mot de passe a été modifié avec succès le <strong>${new Date().toLocaleString('fr-FR')}</strong>.</p>
                
                <div class="info-box">
                    <strong>🔐 Votre compte est maintenant sécurisé avec votre nouveau mot de passe.</strong>
                </div>
                
                <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support à <a href="mailto:support@laevitas.com">support@laevitas.com</a></p>
                
                <p>Pour votre sécurité, nous vous recommandons de :</p>
                <ul>
                    <li>Utiliser un mot de passe unique et complexe</li>
                    <li>Activer l'authentification à deux facteurs</li>
                    <li>Ne jamais partager vos identifiants</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>© 2024 Laevitas - Plateforme de Trading Crypto</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();