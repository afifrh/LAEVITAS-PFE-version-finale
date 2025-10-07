const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const websocketService = require('./services/websocketService');
const syncService = require('./services/syncService');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const portfolioRoutes = require('./routes/portfolio');
const walletRoutes = require('./routes/wallet');
const marketsRoutes = require('./routes/markets');
const binanceRoutes = require('./routes/binanceRoutes');
const coinGeckoRoutes = require('./routes/coinGecko');

// Initialisation de l'application Express
const app = express();

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  }
});

// Middlewares de sécurité
app.use(helmet());
// app.use(limiter);
app.use(morgan('combined'));

// Configuration CORS
// Autoriser les origines de développement courantes (localhost:3000/3001, 127.0.0.1)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://192.168.1.11:3001'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: clients non navigateur)
    if (!origin) return callback(null, true);

    // Autoriser les origines explicitement listées ou tout localhost avec port
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (allowedOrigins.includes(origin) || isLocalhost) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} non autorisée par CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middlewares pour parser les données
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laevitas-trading', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connexion à MongoDB réussie');
  // Créer l'utilisateur admin par défaut
  await require('./utils/createAdmin')();
  // Initialiser les portefeuilles de test
  const { seedWallets } = require('./utils/seedWallets');
  await seedWallets();
})
.catch((error) => {
  console.error('❌ Erreur de connexion à MongoDB:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/binance', binanceRoutes);
app.use('/api/coingecko', coinGeckoRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Serveur Laevitas Trading API en fonctionnement',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialiser le service WebSocket
websocketService.initialize(server);

server.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Interface d'administration disponible sur http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket disponible sur ws://localhost:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  
  // Démarrer le service de synchronisation Binance
  try {
    console.log('🔄 Démarrage du service de synchronisation Binance...');
    await syncService.start();
    console.log('✅ Service de synchronisation Binance démarré avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du service de synchronisation:', error);
  }
});

// Gestion de l'arrêt gracieux du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  gracefulShutdown();
});

function gracefulShutdown() {
  // Arrêter le service de synchronisation
  try {
    syncService.stop();
    console.log('✅ Service de synchronisation arrêté');
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt du service de synchronisation:', error);
  }

  // Fermer les connexions WebSocket
  try {
    websocketService.stop();
    console.log('✅ Connexions WebSocket fermées');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture des WebSockets:', error);
  }

  // Fermer le serveur HTTP
  server.close(() => {
    console.log('✅ Serveur HTTP fermé');
    
    // Fermer la connexion MongoDB
    mongoose.connection.close(false, () => {
      console.log('✅ Connexion MongoDB fermée');
      process.exit(0);
    });
  });
}

module.exports = app;