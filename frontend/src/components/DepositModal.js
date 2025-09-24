import React, { useState } from 'react';
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  CurrencyBitcoinIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import walletService from '../services/walletService';

const DepositModal = ({ onClose, onSubmit, balances }) => {
  const [step, setStep] = useState(1); // 1: Méthode, 2: Montant, 3: Confirmation
  const [formData, setFormData] = useState({
    currency: 'USD',
    amount: '',
    method: '',
    metadata: {}
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const currencies = walletService.getSupportedCurrencies();
  const paymentMethods = walletService.getPaymentMethods('deposit');

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber >= 1 && !formData.method) {
      newErrors.method = 'Veuillez sélectionner une méthode de paiement';
    }

    if (stepNumber >= 2) {
      const amountErrors = walletService.validateAmount(
        parseFloat(formData.amount),
        formData.currency,
        null // Pas de limite pour les dépôts
      );
      if (amountErrors.length > 0) {
        newErrors.amount = amountErrors[0];
      }
    }

    if (stepNumber >= 3) {
      const selectedMethod = paymentMethods.find(m => m.id === formData.method);
      if (selectedMethod) {
        if (formData.method === 'bank_transfer') {
          if (!formData.metadata.accountHolder) {
            newErrors.accountHolder = 'Nom du titulaire requis';
          }
          if (!formData.metadata.iban) {
            newErrors.iban = 'IBAN requis';
          }
        } else if (formData.method === 'crypto_wallet') {
          if (!formData.metadata.address) {
            newErrors.address = 'Adresse du portefeuille requise';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === formData.method);
  const selectedCurrency = currencies.find(c => c.code === formData.currency);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Déposer des fonds
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Étape 1: Sélection de la méthode */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Choisissez votre méthode de paiement
            </h4>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setFormData({ ...formData, method: method.id })}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.method === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {method.id === 'bank_transfer' && <BanknotesIcon className="h-8 w-8 text-green-600" />}
                      {method.id === 'credit_card' && <CreditCardIcon className="h-8 w-8 text-blue-600" />}
                      {method.id === 'crypto_wallet' && <CurrencyBitcoinIcon className="h-8 w-8 text-orange-600" />}
                    </div>
                    <div className="ml-4 flex-1">
                      <h5 className="text-sm font-medium text-gray-900">{method.name}</h5>
                      <p className="text-sm text-gray-500">{method.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Frais: {method.fees}</span>
                        <span className="text-xs text-gray-500">
                          Limite: ${method.limits.min} - ${method.limits.max.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.method && (
              <p className="text-red-600 text-sm">{errors.method}</p>
            )}
          </div>
        )}

        {/* Étape 2: Montant et devise */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Montant à déposer
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {currencies
                    .filter(currency => selectedMethod?.currencies.includes(currency.code))
                    .map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-12"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-500 text-sm">{formData.currency}</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Informations sur les limites */}
            {selectedMethod && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h5 className="text-sm font-medium text-blue-800">
                      Informations sur {selectedMethod.name}
                    </h5>
                    <div className="text-sm text-blue-700 mt-1">
                      <p>Frais: {selectedMethod.fees}</p>
                      <p>Temps de traitement: {selectedMethod.description}</p>
                      <p>
                        Limites: {selectedMethod.limits.min} - {selectedMethod.limits.max.toLocaleString()} {formData.currency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 3: Informations de paiement */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Informations de paiement
            </h4>

            {formData.method === 'bank_transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du titulaire du compte
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.accountHolder || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, accountHolder: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Jean Dupont"
                  />
                  {errors.accountHolder && (
                    <p className="text-red-600 text-sm mt-1">{errors.accountHolder}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.iban || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, iban: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                  />
                  {errors.iban && (
                    <p className="text-red-600 text-sm mt-1">{errors.iban}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BIC/SWIFT (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.bic || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, bic: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="BNPAFRPP"
                  />
                </div>
              </div>
            )}

            {formData.method === 'crypto_wallet' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse du portefeuille source
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.address || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, address: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0x1234567890abcdef..."
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réseau
                  </label>
                  <select
                    value={formData.metadata.network || 'mainnet'}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, network: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="mainnet">Mainnet</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">Binance Smart Chain</option>
                  </select>
                </div>
              </div>
            )}

            {formData.method === 'credit_card' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <h5 className="text-sm font-medium text-yellow-800">
                      Paiement par carte
                    </h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      Vous serez redirigé vers notre processeur de paiement sécurisé pour saisir vos informations de carte.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Résumé */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Résumé du dépôt</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-medium">
                    {walletService.formatAmount(formData.amount, formData.currency)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Méthode:</span>
                  <span className="font-medium">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais:</span>
                  <span className="font-medium">{selectedMethod?.fees}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-900 font-medium">Total à recevoir:</span>
                  <span className="font-bold">
                    {walletService.formatAmount(formData.amount, formData.currency)} {formData.currency}
                  </span>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={step > 1 ? () => setStep(step - 1) : onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {step > 1 ? 'Précédent' : 'Annuler'}
          </button>

          <div className="space-x-3">
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Traitement...' : 'Confirmer le dépôt'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;