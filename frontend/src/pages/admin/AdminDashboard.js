import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner, { CardSpinner, SkeletonLoader } from '../../components/LoadingSpinner';
import UserModal from '../../components/admin/UserModal';
import DeleteUserModal from '../../components/admin/DeleteUserModal';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import { adminService } from '../../services/api';
import {
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ShieldCheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  UsersIcon as UsersSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  CurrencyDollarIcon as CurrencyDollarSolidIcon,
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon
} from '@heroicons/react/24/solid';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // États pour les données
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  // États pour les modales CRUD
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chargement des données réelles depuis l'API
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les statistiques du dashboard
        const statsResponse = await adminService.getDashboardStats();
        if (statsResponse.success) {
          setDashboardStats(statsResponse.data);
        }

        // Charger la liste des utilisateurs
        const userParams = {
          page: 1,
          limit: 50, // Charger plus d'utilisateurs pour l'affichage
          role: filterRole !== 'all' ? filterRole : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm || undefined
        };
        
        const usersResponse = await adminService.getUsers(userParams);
        
        if (usersResponse.success) {
          // Adapter les données pour correspondre au format attendu par le frontend
          const adaptedUsers = usersResponse.data.users.map(user => ({
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
        }

        // Activités récentes (simulées pour l'instant - peut être implémenté plus tard)
        setRecentActivities([
          {
            id: 1,
            type: 'user_registration',
            description: 'Nouvel utilisateur inscrit',
            user: 'Activité récente',
            timestamp: new Date().toLocaleString(),
            status: 'info'
          }
        ]);

        // Alertes système (simulées pour l'instant - peut être implémenté plus tard)
        setSystemAlerts([
          {
            id: 1,
            type: 'info',
            title: 'Système opérationnel',
            message: 'Tous les services fonctionnent normalement',
            timestamp: new Date().toLocaleString(),
            resolved: true
          }
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données admin:', error);
        setIsLoading(false);
        // En cas d'erreur, afficher des données par défaut
        setDashboardStats({
          general: {
            totalUsers: 0,
            activeUsers: 0,
            suspendedUsers: 0,
            adminUsers: 0,
            clientUsers: 0
          }
        });
        setUsers([]);
        setRecentActivities([]);
        setSystemAlerts([]);
      }
    };

    fetchAdminData();
  }, [filterRole, filterStatus, searchTerm]); // Recharger quand les filtres changent

  // Fonction pour recharger les données
  const refreshData = async () => {
    try {
      // Recharger les statistiques
      const statsResponse = await adminService.getDashboardStats();
      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }

      // Recharger les utilisateurs
      const usersResponse = await adminService.getUsers({
        page: 1,
        limit: 50,
        role: filterRole !== 'all' ? filterRole : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      });
      
      if (usersResponse.success) {
        const adaptedUsers = usersResponse.data.users.map(user => ({
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
      }
    } catch (error) {
      console.error('Erreur lors du rechargement des données:', error);
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
        // Mise à jour d'un utilisateur existant
        const response = await adminService.updateUser(selectedUser.id, userData);
        if (response.success) {
          await refreshData(); // Recharger toutes les données
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }
      } else {
        // Création d'un nouvel utilisateur
        const response = await adminService.createUser(userData);
        if (response.success) {
          await refreshData(); // Recharger toutes les données
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
      // Ici vous pourriez ajouter une notification d'erreur
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
        await refreshData(); // Recharger toutes les données
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      // Ici vous pourriez ajouter une notification d'erreur
    } finally {
      setIsSubmitting(false);
    }
  };

  // Les utilisateurs sont déjà filtrés côté serveur via les paramètres de l'API
  const filteredUsers = users;

  // Composant de carte de statistique
  const StatCard = ({ title, value, change, changePercent, icon: Icon, trend, color = 'blue' }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{change} ({changePercent}%)</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-900 bg-opacity-50`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  // Composant d'onglet
  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );

  // Composant d'activité récente
  const ActivityItem = ({ activity }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'success': return 'text-green-400 bg-green-900';
        case 'warning': return 'text-yellow-400 bg-yellow-900';
        case 'error': return 'text-red-400 bg-red-900';
        default: return 'text-blue-400 bg-blue-900';
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
        <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status).split(' ')[1]} bg-opacity-50`}></div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{activity.description}</p>
          <p className="text-gray-400 text-xs">{activity.user}</p>
          {activity.amount && (
            <p className="text-green-400 text-xs font-medium">{activity.amount}</p>
          )}
        </div>
        <span className="text-gray-500 text-xs">{activity.timestamp}</span>
      </div>
    );
  };

  // Composant d'alerte système
  const AlertItem = ({ alert }) => {
    const getAlertIcon = (type) => {
      switch (type) {
        case 'warning': return ExclamationTriangleSolidIcon;
        case 'error': return XCircleIcon;
        case 'success': return CheckCircleIcon;
        default: return ExclamationTriangleIcon;
      }
    };

    const getAlertColor = (type) => {
      switch (type) {
        case 'warning': return 'text-yellow-400 border-yellow-700 bg-yellow-900';
        case 'error': return 'text-red-400 border-red-700 bg-red-900';
        case 'success': return 'text-green-400 border-green-700 bg-green-900';
        default: return 'text-blue-400 border-blue-700 bg-blue-900';
      }
    };

    const Icon = getAlertIcon(alert.type);

    return (
      <div className={`p-4 border-l-4 rounded-r-lg bg-opacity-20 ${getAlertColor(alert.type)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">{alert.title}</h4>
              <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
              <span className="text-xs text-gray-500">{alert.timestamp}</span>
            </div>
          </div>
          {!alert.resolved && (
            <button className="text-xs text-blue-400 hover:text-blue-300">
              Résoudre
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSpinner key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSpinner />
          <CardSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-400 mt-1">
            Bienvenue, {user?.firstName}. Gérez votre plateforme Laevitas.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Rapports
          </button>
          <button 
            onClick={handleCreateUser}
            className="btn-primary"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          id="overview"
          label="Vue d'ensemble"
          isActive={activeTab === 'overview'}
          onClick={setActiveTab}
        />
        <TabButton
          id="users"
          label="Utilisateurs"
          isActive={activeTab === 'users'}
          onClick={setActiveTab}
        />
        <TabButton
          id="system"
          label="Système"
          isActive={activeTab === 'system'}
          onClick={setActiveTab}
        />
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Utilisateurs totaux"
              value={dashboardStats?.general?.totalUsers?.toLocaleString() || '0'}
              change="+23"
              changePercent="2.1"
              icon={UsersSolidIcon}
              trend="up"
              color="blue"
            />
            <StatCard
              title="Utilisateurs actifs"
              value={dashboardStats?.general?.activeUsers?.toLocaleString() || '0'}
              change="+12"
              changePercent="1.4"
              icon={CheckCircleIcon}
              trend="up"
              color="green"
            />
            <StatCard
              title="Utilisateurs suspendus"
              value={dashboardStats?.general?.suspendedUsers?.toLocaleString() || '0'}
              icon={ExclamationTriangleSolidIcon}
              color="red"
            />
            <StatCard
              title="Administrateurs"
              value={dashboardStats?.general?.adminUsers?.toLocaleString() || '0'}
              icon={ShieldCheckIcon}
              color="purple"
            />
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activités récentes */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Activités Récentes</h2>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  Voir tout
                </button>
              </div>
              
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Alertes système */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Alertes Système</h2>
                <span className="text-sm text-gray-400">
                  {systemAlerts.filter(alert => !alert.resolved).length} non résolues
                </span>
              </div>
              
              <div className="space-y-4">
                {systemAlerts.slice(0, 3).map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Nouveaux utilisateurs</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Aujourd'hui</span>
                  <span className="text-white font-medium">{dashboardStats?.newUsersToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cette semaine</span>
                  <span className="text-white font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ce mois</span>
                  <span className="text-white font-medium">642</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Vérifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">En attente</span>
                  <span className="text-yellow-400 font-medium">{dashboardStats?.pendingVerifications}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Approuvées</span>
                  <span className="text-green-400 font-medium">234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rejetées</span>
                  <span className="text-red-400 font-medium">12</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-green-400 font-medium">{dashboardStats?.serverUptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transactions/min</span>
                  <span className="text-white font-medium">45.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latence moyenne</span>
                  <span className="text-white font-medium">125ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filtres et recherche */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-primary pl-10 w-64"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="input-primary"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
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
              <button 
                onClick={handleCreateUser}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouvel utilisateur
              </button>
            </div>
          </div>

          {/* Table des utilisateurs */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-8">
                <SkeletonLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Dernière connexion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Portefeuille
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                          <p className="text-sm mt-1">
                            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                              ? 'Essayez de modifier vos filtres de recherche.'
                              : 'Commencez par créer votre premier utilisateur.'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '?')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.firstName || 'N/A'} {user.lastName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">{user.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-900 bg-opacity-50 text-purple-300'
                            : 'bg-blue-900 bg-opacity-50 text-blue-300'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Client'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-900 bg-opacity-50 text-green-300'
                            : user.status === 'pending'
                            ? 'bg-yellow-900 bg-opacity-50 text-yellow-300'
                            : 'bg-red-900 bg-opacity-50 text-red-300'
                        }`}>
                          {user.status === 'active' ? 'Actif' : 
                           user.status === 'pending' ? 'En attente' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {user.portfolioValue ? `$${user.portfolioValue?.toLocaleString() || '0'}` : 'N/A'}
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
                    ))
                  )}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Santé du système */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Serveurs</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">API Principal</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-400 text-sm">En ligne</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Base de données</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-400 text-sm">En ligne</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cache Redis</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-yellow-400 text-sm">Charge élevée</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">CPU</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">RAM</span>
                  <span className="text-white">67%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stockage</span>
                  <span className="text-white">23%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Sécurité</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Firewall</span>
                  <span className="text-green-400">Actif</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SSL</span>
                  <span className="text-green-400">Valide</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dernière sauvegarde</span>
                  <span className="text-white">6h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toutes les alertes */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">Alertes Système</h2>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </div>
      )}

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

export default AdminDashboard;