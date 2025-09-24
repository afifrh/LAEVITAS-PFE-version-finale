import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteUserModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  user, 
  isLoading = false 
}) => {
  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    onConfirm(user._id || user.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Confirmer la suppression
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-300 mb-3">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </p>
            
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Nom :</span>
                <span className="text-white font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email :</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rôle :</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? 'Administrateur' : 'Client'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Statut :</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.accountStatus === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : user.accountStatus === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : user.accountStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.accountStatus === 'active' && 'Actif'}
                  {user.accountStatus === 'inactive' && 'Inactif'}
                  {user.accountStatus === 'suspended' && 'Suspendu'}
                  {user.accountStatus === 'pending' && 'En attente'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Attention
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Toutes les données de l'utilisateur seront supprimées</li>
                    <li>Les transactions associées seront conservées pour l'audit</li>
                    <li>Cette action ne peut pas être annulée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                <span>Supprimer définitivement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;