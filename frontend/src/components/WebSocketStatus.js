import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import marketService from '../services/marketService';

const WebSocketStatus = ({ className = '' }) => {
  const [status, setStatus] = useState('disconnected');
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Vérifier le statut initial
    const initialStatus = marketService.getConnectionStatus();
    setStatus(initialStatus);

    // Écouter les changements de statut
    const checkStatus = () => {
      const currentStatus = marketService.getConnectionStatus();
      setStatus(currentStatus);
    };

    // Vérifier le statut toutes les 2 secondes
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await marketService.connectWebSocket();
      setStatus('connected');
    } catch (error) {
      console.error('Erreur lors de la reconnexion:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: WifiIcon,
          text: 'Connecté',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200'
        };
      case 'connecting':
        return {
          icon: ArrowPathIcon,
          text: 'Connexion...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200'
        };
      case 'disconnected':
      default:
        return {
          icon: ExclamationTriangleIcon,
          text: 'Déconnecté',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon 
        className={`h-4 w-4 ${config.color} ${status === 'connecting' || isReconnecting ? 'animate-spin' : ''}`} 
      />
      <span className={`text-sm font-medium ${config.color}`}>
        {isReconnecting ? 'Reconnexion...' : config.text}
      </span>
      
      {status === 'disconnected' && !isReconnecting && (
        <button
          onClick={handleReconnect}
          className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled={isReconnecting}
        >
          Reconnecter
        </button>
      )}
    </div>
  );
};

export default WebSocketStatus;