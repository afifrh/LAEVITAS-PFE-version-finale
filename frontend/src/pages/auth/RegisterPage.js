import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLogo } from '../../components/Logo';
import LoadingSpinner, { ButtonSpinner } from '../../components/LoadingSpinner';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RegisterPage = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Validation du mot de passe
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    return requirements;
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};

    // Prénom
    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Nom
    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    // Email
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else {
      const passwordRequirements = validatePassword(formData.password);
      if (!passwordRequirements.length || !passwordRequirements.uppercase || !passwordRequirements.lowercase || !passwordRequirements.number) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères avec une majuscule, une minuscule et un chiffre';
      }
    }

    // Confirmation du mot de passe
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Acceptation des conditions
    if (!acceptTerms) {
      errors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      const result = await register(userData);
      
      if (result.success) {
        // La redirection est gérée automatiquement par le hook useAuth
        console.log('Inscription réussie');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  // Gestion des changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur du champ modifié
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Obtenir les exigences du mot de passe
  const passwordRequirements = validatePassword(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <AuthLogo className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-2">
            Créer un compte
          </h2>
          <p className="text-gray-400">
            Rejoignez la plateforme de trading Laevitas
          </p>
        </div>

        {/* Formulaire d'inscription */}
        <div className="card">
          {/* Affichage des erreurs globales */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-300">Erreur d'inscription</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prénom */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`
                      input-primary pl-10
                      ${formErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}
                    `}
                    placeholder="Prénom"
                  />
                </div>
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.firstName}</p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`
                      input-primary pl-10
                      ${formErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}
                    `}
                    placeholder="Nom"
                  />
                </div>
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`
                    input-primary pl-10
                    ${formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="votre@email.com"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`
                    input-primary pl-10 pr-10
                    ${formErrors.password ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="Mot de passe sécurisé"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-400">{formErrors.password}</p>
              )}

              {/* Indicateurs de force du mot de passe */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-400 mb-1">Exigences du mot de passe :</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center gap-1 ${passwordRequirements.length ? 'text-green-400' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3" />
                      6+ caractères
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.uppercase ? 'text-green-400' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3" />
                      Majuscule
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.lowercase ? 'text-green-400' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3" />
                      Minuscule
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.number ? 'text-green-400' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3" />
                      Chiffre
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation du mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`
                    input-primary pl-10 pr-10
                    ${formErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="Confirmer le mot de passe"
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
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{formErrors.confirmPassword}</p>
              )}
            </div>

            {/* Acceptation des conditions */}
            <div>
              <div className="flex items-start">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded mt-1"
                />
                <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-300">
                  J'accepte les{' '}
                  <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                    politique de confidentialité
                  </Link>
                </label>
              </div>
              {formErrors.terms && (
                <p className="mt-1 text-sm text-red-400">{formErrors.terms}</p>
              )}
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <ButtonSpinner />
                  Création du compte...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Lien vers la connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Compte gratuit</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Vérification rapide</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Accès immédiat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;