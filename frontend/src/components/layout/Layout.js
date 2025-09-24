import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NavLogo } from '../Logo';
import {
  HomeIcon,
  ChartBarIcon,
  UserIcon,
  CogIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, userInfo, getRoleDisplay } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'Vue d\'ensemble'
    },
    {
      name: 'Marchés',
      href: '/markets',
      icon: ChartPieIcon,
      description: 'Aperçu des marchés'
    },
    {
      name: 'Watchlist',
      href: '/watchlist',
      icon: StarIcon,
      description: 'Mes listes de suivi'
    },
    {
      name: 'Portefeuille',
      href: '/wallet',
      icon: CreditCardIcon,
      description: 'Gestion des fonds'
    },
    {
      name: 'Trading',
      href: '/trading',
      icon: ChartBarIcon,
      description: 'Plateforme de trading'
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: UserIcon,
      description: 'Gérer votre profil'
    },
    {
      name: 'Paramètres',
      href: '/settings',
      icon: CogIcon,
      description: 'Configuration'
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Sidebar pour mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 shadow-xl">
          <MobileSidebar 
            navigationItems={navigationItems}
            isActiveRoute={isActiveRoute}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
            user={user}
            userInfo={userInfo}
            getRoleDisplay={getRoleDisplay}
          />
        </div>
      </div>

      {/* Sidebar pour desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <DesktopSidebar 
          navigationItems={navigationItems}
          isActiveRoute={isActiveRoute}
          onLogout={handleLogout}
          user={user}
          userInfo={userInfo}
          getRoleDisplay={getRoleDisplay}
        />
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header 
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
const MobileSidebar = ({ navigationItems, isActiveRoute, onClose, onLogout, user, userInfo, getRoleDisplay }) => (
  <div className="flex h-full flex-col">
    {/* Header du sidebar */}
    <div className="flex items-center justify-between p-4 border-b border-gray-800">
      <NavLogo />
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
            group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
            ${isActiveRoute(item.href)
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          <div>
            <div>{item.name}</div>
            <div className="text-xs opacity-75">{item.description}</div>
          </div>
        </Link>
      ))}
    </nav>

    {/* Profil utilisateur */}
    <UserProfile user={user} userInfo={userInfo} onLogout={onLogout} getRoleDisplay={getRoleDisplay} />
  </div>
);

// Composant Sidebar pour desktop
const DesktopSidebar = ({ navigationItems, isActiveRoute, onLogout, user, userInfo, getRoleDisplay }) => (
  <div className="flex h-full flex-col bg-gray-900 shadow-xl">
    {/* Header du sidebar */}
    <div className="flex items-center p-6 border-b border-gray-800">
      <NavLogo />
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`
            group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
            ${isActiveRoute(item.href)
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          <div>
            <div>{item.name}</div>
            <div className="text-xs opacity-75">{item.description}</div>
          </div>
        </Link>
      ))}
    </nav>

    {/* Profil utilisateur */}
    <UserProfile user={user} userInfo={userInfo} onLogout={onLogout} getRoleDisplay={getRoleDisplay} />
  </div>
);

// Composant Header
const Header = ({ onMenuClick, user, userInfo }) => (
  <header className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border-b border-gray-700 shadow-lg">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        {/* Bouton menu mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Barre de recherche */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions header */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Avatar utilisateur */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-white">{userInfo?.fullName}</div>
              <div className="text-xs text-gray-400">{userInfo?.email}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {userInfo?.initials}
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
);

// Composant Profil utilisateur
const UserProfile = ({ user, userInfo, onLogout, getRoleDisplay }) => (
  <div className="p-4 border-t border-gray-800">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
        {userInfo?.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{userInfo?.fullName}</div>
        <div className="text-xs text-gray-400 truncate">{userInfo?.email}</div>
        <div className="text-xs text-blue-400 capitalize">{getRoleDisplay()}</div>
      </div>
    </div>

    <button
      onClick={onLogout}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
    >
      <ArrowRightOnRectangleIcon className="h-4 w-4" />
      Déconnexion
    </button>
  </div>
);

export default Layout;