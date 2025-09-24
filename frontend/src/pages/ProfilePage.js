import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    priceAlerts: true,
    marketUpdates: false,
    securityAlerts: true,
    newsletter: false
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Validation du mot de passe
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  // Gestion de la mise à jour du profil
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccessMessage('Profil mis à jour avec succès');
        setIsEditing(false);
      }
    } catch (error) {
      setErrors({ profile: error.message });
    }
  };

  // Gestion du changement de mot de passe
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: 'Les mots de passe ne correspondent pas' });
      return;
    }

    const passwordRequirements = validatePassword(passwordData.newPassword);
    if (!Object.values(passwordRequirements).every(Boolean)) {
      setErrors({ password: 'Le mot de passe ne respecte pas les exigences de sécurité' });
      return;
    }

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setSuccessMessage('Mot de passe modifié avec succès');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setErrors({ password: error.message });
    }
  };

  // Composant d'onglet
  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  // Composant de champ de profil
  const ProfileField = ({ label, value, name, type = 'text', disabled = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => setProfileData(prev => ({ ...prev, [name]: e.target.value }))}
        disabled={disabled || !isEditing}
        className={`input-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <CameraIcon className="h-4 w-4 text-white" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-400">{user?.email}</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  user?.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className={`text-sm ${
                  user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {user?.isEmailVerified ? 'Email vérifié' : 'Email non vérifié'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              user?.role === 'admin' 
                ? 'bg-purple-900 bg-opacity-50 text-purple-300 border border-purple-700'
                : 'bg-blue-900 bg-opacity-50 text-blue-300 border border-blue-700'
            }`}>
              {user?.role === 'admin' ? 'Administrateur' : 'Client'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          id="profile"
          label="Profil"
          icon={UserIcon}
          isActive={activeTab === 'profile'}
          onClick={setActiveTab}
        />
        <TabButton
          id="security"
          label="Sécurité"
          icon={ShieldCheckIcon}
          isActive={activeTab === 'security'}
          onClick={setActiveTab}
        />
        <TabButton
          id="notifications"
          label="Notifications"
          icon={BellIcon}
          isActive={activeTab === 'notifications'}
          onClick={setActiveTab}
        />
      </div>

      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg flex items-center gap-3">
          <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300">{successMessage}</p>
        </div>
      )}

      {/* Contenu des onglets */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Informations Personnelles</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {errors.profile && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{errors.profile}</p>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileField
                label="Prénom"
                value={profileData.firstName}
                name="firstName"
              />
              <ProfileField
                label="Nom"
                value={profileData.lastName}
                name="lastName"
              />
            </div>

            <ProfileField
              label="Adresse email"
              value={profileData.email}
              name="email"
              type="email"
              disabled={true}
            />

            <ProfileField
              label="Téléphone"
              value={profileData.phone}
              name="phone"
              type="tel"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Biographie
              </label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                rows={4}
                className="input-primary resize-none"
                placeholder="Parlez-nous de vous..."
              />
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <>
                      <ButtonSpinner />
                      Mise à jour...
                    </>
                  ) : (
                    'Sauvegarder'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Changement de mot de passe */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6">Changer le Mot de Passe</h2>

            {errors.password && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{errors.password}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Mot de passe actuel */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="input-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="input-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Indicateurs de force du mot de passe */}
                {passwordData.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-400 mb-1">Exigences du mot de passe :</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(validatePassword(passwordData.newPassword)).map(([key, valid]) => (
                        <div key={key} className={`flex items-center gap-1 ${valid ? 'text-green-400' : 'text-gray-500'}`}>
                          <CheckCircleIcon className="h-3 w-3" />
                          {key === 'length' && '8+ caractères'}
                          {key === 'uppercase' && 'Majuscule'}
                          {key === 'lowercase' && 'Minuscule'}
                          {key === 'number' && 'Chiffre'}
                          {key === 'special' && 'Spécial'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation du mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="input-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner />
                    Modification...
                  </>
                ) : (
                  'Changer le mot de passe'
                )}
              </button>
            </form>
          </div>

          {/* Authentification à deux facteurs */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Authentification à Deux Facteurs</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">Sécurisez votre compte avec l'authentification 2FA</p>
                <p className="text-gray-400 text-sm mt-1">Recommandé pour une sécurité maximale</p>
              </div>
              <button className="btn-secondary">
                Configurer 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Préférences de Notification</h2>
          
          <div className="space-y-6">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">
                    {key === 'emailNotifications' && 'Notifications par email'}
                    {key === 'priceAlerts' && 'Alertes de prix'}
                    {key === 'marketUpdates' && 'Mises à jour du marché'}
                    {key === 'securityAlerts' && 'Alertes de sécurité'}
                    {key === 'newsletter' && 'Newsletter'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {key === 'emailNotifications' && 'Recevoir des notifications par email'}
                    {key === 'priceAlerts' && 'Alertes quand vos cryptos atteignent un prix cible'}
                    {key === 'marketUpdates' && 'Informations sur les tendances du marché'}
                    {key === 'securityAlerts' && 'Notifications de sécurité importantes'}
                    {key === 'newsletter' && 'Recevoir notre newsletter hebdomadaire'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <button className="btn-primary">
              Sauvegarder les préférences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;