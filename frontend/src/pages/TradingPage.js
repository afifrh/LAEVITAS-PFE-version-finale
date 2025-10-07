import React, { useEffect } from 'react';
import TradingDashboard from '../components/TradingDashboard';
import WebSocketStatus from '../components/WebSocketStatus';
import marketService from '../services/marketService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page de trading principale
 * Utilise le composant TradingDashboard pour afficher les données de marché
 * Inclut la connexion WebSocket pour les données en temps réel
 */
const TradingPage = () => {
  const { isAuthenticated, status } = useAuth();

  // Se connecter au WebSocket quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && status === 'authenticated') {
      connectToWebSocket();
    }
    
    return () => {
      // Nettoyer la connexion lors du démontage du composant
      marketService.disconnect();
    };
  }, [isAuthenticated, status]);

  // Fonction pour se connecter au WebSocket
  const connectToWebSocket = async () => {
    try {
      console.log('🔌 Connexion WebSocket depuis TradingPage...');
      await marketService.connectWebSocket();
      console.log('✅ WebSocket connecté avec succès dans TradingPage');
    } catch (error) {
      console.error('❌ Erreur de connexion WebSocket dans TradingPage:', error);
    }
  };

  return (
    <div className="trading-page">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Plateforme de Trading
            </h1>
            <p className="text-gray-400">
              Accédez aux marchés financiers en temps réel - Cryptomonnaies, Actions, Forex
            </p>
          </div>
          
          {/* Statut de connexion WebSocket */}
          <WebSocketStatus className="ml-4" />
        </div>
      </div>
      
      <TradingDashboard />
    </div>
  );
};

export default TradingPage;