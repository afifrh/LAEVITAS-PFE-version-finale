import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner, { SkeletonLoader } from '../../components/LoadingSpinner';
import UserModal from '../../components/admin/UserModal';
import DeleteUserModal from '../../components/admin/DeleteUserModal';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import { adminService } from '../../services/api';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // États pour les données
  const [users, setUsers] = useState([]);

  // États pour les modales CRUD
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.getUsers({
          page: currentPage,
          limit: 20,
          role: filterRole !== 'all' ? filterRole : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        });
        
        if (response.success) {
          const adaptedUsers = response.data.users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.accountStatus,
            isEmailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            totalTransactions: user.totalTransactions || 0,
            portfolioValue: user.portfolioValue || 0,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            tradingPreferences: user.tradingPreferences
          }));
          setUsers(adaptedUsers);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setTotalUsers(response.data.pagination?.totalUsers || 0);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, filterRole, filterStatus, searchTerm, sortBy, sortOrder]);

  // Fonction pour recharger les données
  const refreshData = async () => {
    try {
      const response = await adminService.getUsers({
        page: currentPage,
        limit: 20,
        role: filterRole !== 'all' ? filterRole : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      });
      
      if (response.success) {
        const adaptedUsers = response.data.users.map(user => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.accountStatus,
          isEmailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          totalTransactions: user.totalTransactions || 0,
          portfolioValue: user.portfolioValue || 0,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          tradingPreferences: user.tradingPreferences
        }));
        setUsers(adaptedUsers);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalUsers(response.data.pagination?.totalUsers || 0);
      }
    } catch (error) {
      console.error('Erreur lors du rechargement des utilisateurs:', error);
    }
  };

  // Fonctions CRUD pour les utilisateurs
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setIsUserModalOpen(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUserSubmit = async (userData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && selectedUser) {
        const response = await adminService.updateUser(selectedUser.id, userData);
        if (response.success) {
          await refreshData();
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }
      } else {
        const response = await adminService.createUser(userData);
        if (response.success) {
          await refreshData();
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      const response = await adminService.deleteUser(selectedUser.id);
      if (response.success) {
        await refreshData();
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction de tri
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Fonction de pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-900 bg-opacity-50 text-red-300';
      case 'trader': return 'bg-blue-900 bg-opacity-50 text-blue-300';
      case 'client': return 'bg-green-900 bg-opacity-50 text-green-300';
      default: return 'bg-gray-900 bg-opacity-50 text-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-900 bg-opacity-50 text-green-300';
      case 'pending': return 'bg-yellow-900 bg-opacity-50 text-yellow-300';
      case 'suspended': return 'bg-red-900 bg-opacity-50 text-red-300';
      default: return 'bg-gray-900 bg-opacity-50 text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-blue-400" />
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-400 mt-1">
            {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Créer un utilisateur
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10 w-full"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-primary"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="trader">Trader</option>
              <option value="client">Client</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('firstName')}
                >
                  Utilisateur
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('email')}
                >
                  Email
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('role')}
                >
                  Rôle
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('accountStatus')}
                >
                  Statut
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('lastLogin')}
                >
                  Dernière connexion
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('createdAt')}
                >
                  Date création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          {user.isEmailVerified ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-400 mr-1" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-400 mr-1" />
                          )}
                          {user.isEmailVerified ? 'Vérifié' : 'Non vérifié'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role === 'admin' && <ShieldCheckIcon className="h-3 w-3 mr-1" />}
                      {user.role === 'admin' ? 'Admin' : 
                       user.role === 'trader' ? 'Trader' : 'Client'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Actif' : 
                       user.status === 'pending' ? 'En attente' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Affichage de <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalUsers)}</span> sur{' '}
                  <span className="font-medium">{totalUsers}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales CRUD */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
          setIsEditMode(false);
        }}
        onSubmit={handleUserSubmit}
        user={selectedUser}
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleUserDelete}
        user={selectedUser}
        isSubmitting={isSubmitting}
      />

      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagement;