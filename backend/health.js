// Endpoint de santé pour Docker health checks
const express = require('express');
const mongoose = require('mongoose');

const createHealthRouter = () => {
  const router = express.Router();

  // Endpoint de santé simple
  router.get('/health', (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    try {
      // Vérifier la connexion MongoDB
      const mongoState = mongoose.connection.readyState;
      const mongoStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      healthCheck.database = {
        status: mongoStates[mongoState],
        connected: mongoState === 1
      };

      // Vérifier la mémoire
      const memUsage = process.memoryUsage();
      healthCheck.memory = {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
      };

      // Si tout va bien, retourner 200
      if (mongoState === 1) {
        res.status(200).json(healthCheck);
      } else {
        // Si la base de données n'est pas connectée, retourner 503
        res.status(503).json({
          ...healthCheck,
          message: 'Service Unavailable - Database not connected'
        });
      }
    } catch (error) {
      healthCheck.message = 'Error';
      healthCheck.error = error.message;
      res.status(503).json(healthCheck);
    }
  });

  // Endpoint de santé détaillé
  router.get('/health/detailed', (req, res) => {
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Laevitas Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        process: process.uptime(),
        system: require('os').uptime()
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      database: {
        mongodb: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          host: mongoose.connection.host,
          name: mongoose.connection.name
        }
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      }
    };

    res.json(detailedHealth);
  });

  return router;
};

module.exports = createHealthRouter;