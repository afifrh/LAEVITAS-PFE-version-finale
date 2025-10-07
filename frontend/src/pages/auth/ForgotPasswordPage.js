import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AuthLogo } from '../../components/Logo';
import LoadingSpinner, { ButtonSpinner } from '../../components/LoadingSpinner';

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message);
      } else {
        if (data.errors) {
          const fieldErrors = {};
          data.errors.forEach(error => {
            fieldErrors[error.path] = error.msg;
          });
          setErrors(fieldErrors);
        } else {
          setMessage(data.message || 'Une erreur est survenue');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la demande:', error);
      setMessage('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AuthLogo className="mx-auto mb-6" />
            <div className="card">
              <div className="w-16 h-16 bg-green-900 bg-opacity-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Email envoyé !
              </h2>
              <p className="text-gray-300 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Vérifiez votre boîte de réception et vos spams. Le lien est valide pendant 1 heure.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setMessage('');
                    setFormData({ email: '' });
                  }}
                  className="w-full flex justify-center px-4 py-2 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Renvoyer un email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <AuthLogo className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-2">
            Mot de passe oublié ?
          </h2>
          <p className="text-gray-400">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Formulaire de récupération */}
        <div className="card">
          {/* Affichage des erreurs globales */}
          {message && !isSuccess && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-300">Erreur</h3>
                <p className="text-sm text-red-400 mt-1">{message}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Champ Email */}
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
                    ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <ButtonSpinner />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <EnvelopeIcon className="w-5 h-5 mr-2" />
                  Envoyer le lien de réinitialisation
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </form>

          {/* Lien vers l'inscription */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Vous n'avez pas encore de compte ?{' '}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sécurisé SSL</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Support 24/7</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Récupération Rapide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;