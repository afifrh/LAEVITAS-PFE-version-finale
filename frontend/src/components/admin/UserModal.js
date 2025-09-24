import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Settings, Shield, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const UserModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user = null, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'client',
    accountStatus: 'active',
    phone: '',
    dateOfBirth: '',
    emailVerified: true,
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: ''
    },
    tradingPreferences: {
      riskLevel: 'medium',
      preferredCurrencies: [],
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Mode édition - pré-remplir avec les données de l'utilisateur
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          password: '', // Ne pas pré-remplir le mot de passe
          role: user.role || 'client',
          accountStatus: user.accountStatus || 'active',
          phone: user.phone || '',
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
          emailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            postalCode: user.address?.postalCode || '',
            country: user.address?.country || ''
          },
          tradingPreferences: {
            riskLevel: user.tradingPreferences?.riskLevel || 'medium',
            preferredCurrencies: user.tradingPreferences?.preferredCurrencies || [],
            notifications: {
              email: user.tradingPreferences?.notifications?.email !== undefined ? user.tradingPreferences.notifications.email : true,
              push: user.tradingPreferences?.notifications?.push !== undefined ? user.tradingPreferences.notifications.push : true,
              sms: user.tradingPreferences?.notifications?.sms !== undefined ? user.tradingPreferences.notifications.sms : false
            }
          }
        });
      } else {
        // Mode création - réinitialiser le formulaire
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'client',
          accountStatus: 'active',
          phone: '',
          dateOfBirth: '',
          emailVerified: true,
          address: {
            street: '',
            city: '',
            postalCode: '',
            country: ''
          },
          tradingPreferences: {
            riskLevel: 'medium',
            preferredCurrencies: [],
            notifications: {
              email: true,
              push: true,
              sms: false
            }
          }
        });
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.includes('notifications.')) {
      const notificationType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        tradingPreferences: {
          ...prev.tradingPreferences,
          notifications: {
            ...prev.tradingPreferences.notifications,
            [notificationType]: checked
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCurrencyChange = (currency) => {
    setFormData(prev => ({
      ...prev,
      tradingPreferences: {
        ...prev.tradingPreferences,
        preferredCurrencies: prev.tradingPreferences.preferredCurrencies.includes(currency)
          ? prev.tradingPreferences.preferredCurrencies.filter(c => c !== currency)
          : [...prev.tradingPreferences.preferredCurrencies, currency]
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation des champs obligatoires
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Validation du mot de passe (obligatoire seulement en mode création)
    if (!user && !formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Validation du téléphone
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      // Préparer les données à envoyer
      const submitData = { ...formData };
      
      // Ne pas envoyer le mot de passe s'il est vide en mode édition
      if (user && !submitData.password) {
        delete submitData.password;
      }

      // Nettoyer les champs vides
      if (!submitData.phone) delete submitData.phone;
      if (!submitData.dateOfBirth) delete submitData.dateOfBirth;
      
      // Nettoyer l'adresse si tous les champs sont vides
      const addressFields = Object.values(submitData.address);
      if (addressFields.every(field => !field.trim())) {
        delete submitData.address;
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Informations de base', icon: User },
    { id: 'contact', label: 'Contact & Adresse', icon: MapPin },
    { id: 'preferences', label: 'Préférences', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  const currencies = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE', 'MATIC'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {user ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Onglet Informations de base */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Entrez le prénom"
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Entrez le nom"
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Entrez l'email"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mot de passe {!user && '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder={user ? "Laisser vide pour ne pas modifier" : "Entrez le mot de passe"}
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rôle
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="client">Client</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Statut du compte
                    </label>
                    <select
                      name="accountStatus"
                      value={formData.accountStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                      <option value="pending">En attente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Onglet Contact & Adresse */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="+33 1 23 45 67 89"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rue et numéro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ville"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Code postal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pays"
                  />
                </div>
              </div>
            )}

            {/* Onglet Préférences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Niveau de risque
                  </label>
                  <select
                    name="tradingPreferences.riskLevel"
                    value={formData.tradingPreferences.riskLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Élevé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Cryptomonnaies préférées
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {currencies.map((currency) => (
                      <label key={currency} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tradingPreferences.preferredCurrencies.includes(currency)}
                          onChange={() => handleCurrencyChange(currency)}
                          className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-gray-300">{currency}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Notifications
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="notifications.email"
                        checked={formData.tradingPreferences.notifications.email}
                        onChange={handleInputChange}
                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-300">Notifications par email</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="notifications.push"
                        checked={formData.tradingPreferences.notifications.push}
                        onChange={handleInputChange}
                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Settings size={16} className="text-gray-400" />
                        <span className="text-gray-300">Notifications push</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="notifications.sms"
                        checked={formData.tradingPreferences.notifications.sms}
                        onChange={handleInputChange}
                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-300">Notifications SMS</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="emailVerified"
                    checked={formData.emailVerified}
                    onChange={handleInputChange}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <label className="text-gray-300">Email vérifié</label>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Informations de sécurité</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>• Les utilisateurs créés par l'admin ont leur email automatiquement vérifié</p>
                    <p>• Le mot de passe sera haché automatiquement lors de la sauvegarde</p>
                    <p>• En mode édition, laisser le mot de passe vide pour ne pas le modifier</p>
                  </div>
                </div>
              </div>
            )}
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
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : (user ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;