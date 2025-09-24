import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  Settings
} from 'lucide-react';

const UserDetailsModal = ({ 
  isOpen, 
  onClose, 
  user 
}) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Actif' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactif' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspendu' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        role === 'admin' 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {role === 'admin' ? 'Administrateur' : 'Client'}
      </span>
    );
  };

  const getRiskLevelBadge = (level) => {
    const levelConfig = {
      low: { color: 'bg-green-100 text-green-800', label: 'Faible' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Moyen' },
      high: { color: 'bg-red-100 text-red-800', label: 'Élevé' }
    };

    const config = levelConfig[level] || levelConfig.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Informations générales */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Prénom
                  </label>
                  <p className="text-white">{user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nom
                  </label>
                  <p className="text-white">{user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Téléphone
                  </label>
                  <p className="text-white">{user.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Date de naissance
                  </label>
                  <p className="text-white">{formatDateOnly(user.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Rôle
                  </label>
                  <div>{getRoleBadge(user.role)}</div>
                </div>
              </div>
            </div>

            {/* Statut et sécurité */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Statut et sécurité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Statut du compte
                  </label>
                  <div>{getStatusBadge(user.accountStatus)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email vérifié
                  </label>
                  <div className="flex items-center space-x-2">
                    {user.emailVerified ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-400">Vérifié</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-400">Non vérifié</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Date de création
                  </label>
                  <p className="text-white">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Dernière connexion
                  </label>
                  <p className="text-white">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </div>

            {/* Adresse */}
            {user.address && (Object.values(user.address).some(value => value)) && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Adresse
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Rue
                    </label>
                    <p className="text-white">{user.address.street || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Ville
                    </label>
                    <p className="text-white">{user.address.city || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Code postal
                    </label>
                    <p className="text-white">{user.address.postalCode || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Pays
                    </label>
                    <p className="text-white">{user.address.country || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Préférences de trading */}
            {user.tradingPreferences && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Préférences de trading
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Niveau de risque
                    </label>
                    <div>{getRiskLevelBadge(user.tradingPreferences.riskLevel)}</div>
                  </div>
                  
                  {user.tradingPreferences.preferredCurrencies && user.tradingPreferences.preferredCurrencies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Cryptomonnaies préférées
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {user.tradingPreferences.preferredCurrencies.map((currency) => (
                          <span
                            key={currency}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium"
                          >
                            {currency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.tradingPreferences.notifications && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Notifications
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Email :</span>
                          {user.tradingPreferences.notifications.email ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Push :</span>
                          {user.tradingPreferences.notifications.push ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-white">SMS :</span>
                          {user.tradingPreferences.notifications.sms ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistiques (si disponibles) */}
            {(user.totalTransactions !== undefined || user.portfolioValue !== undefined) && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Statistiques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.totalTransactions !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Nombre de transactions
                      </label>
                      <p className="text-white text-lg font-semibold">{user.totalTransactions}</p>
                    </div>
                  )}
                  {user.portfolioValue !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Valeur du portefeuille
                      </label>
                      <p className="text-white text-lg font-semibold">
                        {user.portfolioValue.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;