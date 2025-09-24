import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NavLogo } from '../Logo';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, userInfo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items pour admin
  const navigationItems = [
    {
      name: 'Dashboard Admin',
      href: '/admin/dashboard',
      icon: HomeIcon,
      description: 'Vue d\'ensemble administrative',
      badge: null
    },
    {
      name: 'Gestion Utilisateurs',
      href: '/admin/users',
      icon: UsersIcon,
      description: 'Gérer les comptes utilisateurs',
      badge: '12'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      description: 'Statistiques et rapports',
      badge: null
    },
    {
      name: 'Rapports',
      href: '/admin/reports',
      icon: DocumentChartBarIcon,
      description: 'Rapports détaillés',
      badge: null
    },
    {
      name: 'Sécurité',
      href: '/admin/security',
      icon: ShieldCheckIcon,
      description: 'Logs et sécurité',
      badge: '3'
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: CogIcon,
      description: 'Configuration système',
      badge: null
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleViewAsClient = () => {
    navigate('/dashboard');
  };

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900">
      {/* Sidebar pour mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 shadow-xl">
          <MobileSidebar 
            navigationItems={navigationItems}
            isActiveRoute={isActiveRoute}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
            onViewAsClient={handleViewAsClient}
            user={user}
            userInfo={userInfo}
          />
        </div>
      </div>

      {/* Sidebar pour desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <DesktopSidebar 
          navigationItems={navigationItems}
          isActiveRoute={isActiveRoute}
          onLogout={handleLogout}
          onViewAsClient={handleViewAsClient}
          user={user}
          userInfo={userInfo}
        />
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64">
        {/* Header Admin */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          userInfo={userInfo}
        />

        {/* Contenu de la page */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Composant Sidebar pour mobile
const MobileSidebar = ({ navigationItems, isActiveRoute, onClose, onLogout, onViewAsClient, user, userInfo }) => (
  <div className="flex h-full flex-col">
    {/* Header du sidebar */}
    <div className="flex items-center justify-between p-4 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <NavLogo />
        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-semibold">
          ADMIN
        </span>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={onClose}
          className={`
            group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
            ${isActiveRoute(item.href)
              ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          <div className="flex items-center">
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <div>
              <div>{item.name}</div>
              <div className="text-xs opacity-75">{item.description}</div>
            </div>
          </div>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>

    {/* Actions admin */}
    <div className="px-4 py-4 border-t border-gray-800">
      <button
        onClick={() => { onViewAsClient(); onClose(); }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded-lg transition-all duration-200"
      >
        <EyeIcon className="h-4 w-4" />
        Voir comme client
      </button>
    </div>

    {/* Profil utilisateur */}
    <AdminUserProfile user={user} userInfo={userInfo} onLogout={onLogout} />
  </div>
);

// Composant Sidebar pour desktop
const DesktopSidebar = ({ navigationItems, isActiveRoute, onLogout, onViewAsClient, user, userInfo }) => (
  <div className="flex h-full flex-col bg-gray-900 shadow-xl border-r border-red-900">
    {/* Header du sidebar */}
    <div className="flex items-center justify-between p-6 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <NavLogo />
        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-semibold">
          ADMIN
        </span>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`
            group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
            ${isActiveRoute(item.href)
              ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          <div className="flex items-center">
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <div>
              <div>{item.name}</div>
              <div className="text-xs opacity-75">{item.description}</div>
            </div>
          </div>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>

    {/* Actions admin */}
    <div className="px-4 py-4 border-t border-gray-800">
      <button
        onClick={onViewAsClient}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded-lg transition-all duration-200"
      >
        <EyeIcon className="h-4 w-4" />
        Voir comme client
      </button>
    </div>

    {/* Profil utilisateur */}
    <AdminUserProfile user={user} userInfo={userInfo} onLogout={onLogout} />
  </div>
);

// Composant Header Admin
const AdminHeader = ({ onMenuClick, user, userInfo }) => (
  <header className="bg-red-900 bg-opacity-20 backdrop-filter backdrop-blur-lg border-b border-red-700 shadow-lg">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        {/* Bouton menu mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Indicateur admin */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-red-600 bg-opacity-20 px-3 py-1 rounded-full border border-red-500">
            <ShieldCheckIcon className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">Mode Administrateur</span>
          </div>
        </div>

        {/* Barre de recherche admin */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher utilisateurs, logs..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-red-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions header admin */}
        <div className="flex items-center gap-4">
          {/* Notifications admin */}
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Avatar utilisateur admin */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-white">{userInfo?.fullName}</div>
              <div className="text-xs text-red-400 font-semibold">Administrateur</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-red-500">
              {userInfo?.initials}
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
);

// Composant Profil utilisateur admin
const AdminUserProfile = ({ user, userInfo, onLogout }) => (
  <div className="p-4 border-t border-gray-800 bg-red-900 bg-opacity-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-600 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-red-500">
        {userInfo?.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{userInfo?.fullName}</div>
        <div className="text-xs text-gray-400 truncate">{userInfo?.email}</div>
        <div className="text-xs text-red-400 font-semibold">Administrateur</div>
      </div>
    </div>

    <button
      onClick={onLogout}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-red-800 hover:bg-opacity-30 rounded-lg transition-all duration-200"
    >
      <ArrowRightOnRectangleIcon className="h-4 w-4" />
      Déconnexion
    </button>
  </div>
);

export default AdminLayout;