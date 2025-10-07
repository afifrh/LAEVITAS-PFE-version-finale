import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Contextes
import { AuthProvider } from './contexts/AuthContext';

// Composants de protection des routes
import ProtectedRoute, { AdminRoute, GuestRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TradingPage from './pages/TradingPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

// Composants
import WalletManagement from './components/WalletManagement';
import MarketOverview from './components/MarketOverview';
import Watchlist from './components/Watchlist';




// Composants de layout
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Configuration des toasts
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#1f2937',
    color: '#f9fafb',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#f9fafb',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#f9fafb',
    },
  },
  loading: {
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#f9fafb',
    },
  },
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Routes>
              {/* Routes publiques (invités uniquement) */}
              <Route path="/login" element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              } />
              
              <Route path="/register" element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              } />

              <Route path="/forgot-password" element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              } />

              <Route path="/reset-password" element={
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              } />

              {/* Routes protégées - Client */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Layout>
                    <WalletManagement />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/markets" element={
                <ProtectedRoute>
                  <Layout>
                    <MarketOverview />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/watchlist" element={
                <ProtectedRoute>
                  <Layout>
                    <Watchlist />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/trading" element={
                <ProtectedRoute>
                  <Layout>
                    <TradingPage />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Routes protégées - Admin */}
              <Route path="/admin/*" element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="settings" element={<div>Paramètres admin</div>} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              } />

              

              {/* Redirection par défaut vers la page de login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Route catch-all - redirige vers la page de login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            {/* Toast notifications */}
            <Toaster toastOptions={toastOptions} />
          </div>

          {/* React Query DevTools (uniquement en développement) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;