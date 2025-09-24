import React, { useState } from 'react';
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  CurrencyBitcoinIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import walletService from '../services/walletService';

const WithdrawModal = ({ onClose, onSubmit, balances }) => {
  const [step, setStep] = useState(1); // 1: Méthode, 2: Montant, 3: Destination, 4: Confirmation
  const [formData, setFormData] = useState({
    currency: 'USD',
    amount: '',
    method: '',
    metadata: {}
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState(null);

  const currencies = walletService.getSupportedCurrencies();
  const paymentMethods = walletService.getPaymentMethods('withdrawal');

  // Calculer les frais quand le montant ou la méthode change
  React.useEffect(() => {
    if (formData.amount && formData.method && formData.currency) {
      const calculatedFees = walletService.calculateWithdrawalFees(
        parseFloat(formData.amount),
        formData.currency,
        formData.method
      );
      setFees(calculatedFees);
    }
  }, [formData.amount, formData.method, formData.currency]);

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber >= 1 && !formData.method) {
      newErrors.method = 'Veuillez sélectionner une méthode de retrait';
    }

    if (stepNumber >= 2) {
      const balance = balances.find(b => b.currency === formData.currency);
      const amountErrors = walletService.validateAmount(
        parseFloat(formData.amount),
        formData.currency,
        balance
      );
      if (amountErrors.length > 0) {
        newErrors.amount = amountErrors[0];
      }

      // Vérifier si le montant + frais est disponible
      if (balance && fees) {
        const totalRequired = parseFloat(formData.amount) + fees.amount;
        if (totalRequired > balance.available) {
          newErrors.amount = 'Fonds insuffisants (incluant les frais)';
        }
      }
    }

    if (stepNumber >= 3) {
      const selectedMethod = paymentMethods.find(m => m.id === formData.method);
      if (selectedMethod) {
        if (formData.method === 'bank_transfer') {
          if (!formData.metadata.accountHolder) {
            newErrors.accountHolder = 'Nom du bénéficiaire requis';
          }
          if (!formData.metadata.iban) {
            newErrors.iban = 'IBAN requis';
          }
        } else if (formData.method === 'crypto_wallet') {
          if (!formData.metadata.address) {
            newErrors.address = 'Adresse de destination requise';
          }
          if (!formData.metadata.network) {
            newErrors.network = 'Réseau requis';
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
    if (!validateStep(4)) return;

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
  const currentBalance = balances.find(b => b.currency === formData.currency);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Retirer des fonds
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
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= stepNumber 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-12 h-1 mx-2 ${
                  step > stepNumber ? 'bg-red-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Étape 1: Sélection de la méthode */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Choisissez votre méthode de retrait
            </h4>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setFormData({ ...formData, method: method.id })}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.method === method.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {method.id === 'bank_transfer' && <BanknotesIcon className="h-8 w-8 text-green-600" />}
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
              Montant à retirer
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

            {/* Solde disponible */}
            {currentBalance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Solde disponible:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {walletService.formatAmount(currentBalance.available, formData.currency)} {formData.currency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: currentBalance.available.toString() })}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  Retirer tout
                </button>
              </div>
            )}

            {/* Calcul des frais */}
            {fees && formData.amount && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">Frais de retrait</h5>
                <div className="space-y-1 text-sm text-yellow-700">
                  <div className="flex justify-between">
                    <span>Montant à retirer:</span>
                    <span>{walletService.formatAmount(formData.amount, formData.currency)} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais:</span>
                    <span>{walletService.formatAmount(fees.amount, fees.currency)} {fees.currency}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-medium">
                    <span>Total prélevé:</span>
                    <span>
                      {walletService.formatAmount(
                        parseFloat(formData.amount) + (fees.currency === formData.currency ? fees.amount : 0),
                        formData.currency
                      )} {formData.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Informations sur les limites */}
            {selectedMethod && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="ml-3">
                    <h5 className="text-sm font-medium text-gray-900">
                      Informations sur {selectedMethod.name}
                    </h5>
                    <div className="text-sm text-gray-700 mt-1">
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

        {/* Étape 3: Destination */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Destination du retrait
            </h4>

            {formData.method === 'bank_transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du bénéficiaire
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
                    Adresse de destination
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
                    value={formData.metadata.network || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, network: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Sélectionner un réseau</option>
                    <option value="mainnet">Mainnet</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">Binance Smart Chain</option>
                  </select>
                  {errors.network && (
                    <p className="text-red-600 text-sm mt-1">{errors.network}</p>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-red-800">
                        Attention
                      </h5>
                      <p className="text-sm text-red-700 mt-1">
                        Vérifiez soigneusement l'adresse de destination. Les transactions crypto sont irréversibles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Confirmation du retrait
            </h4>

            {/* Résumé complet */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h5 className="text-sm font-medium text-gray-900 mb-4">Résumé du retrait</h5>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant à retirer:</span>
                  <span className="font-medium">
                    {walletService.formatAmount(formData.amount, formData.currency)} {formData.currency}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Méthode:</span>
                  <span className="font-medium">{selectedMethod?.name}</span>
                </div>

                {fees && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais:</span>
                    <span className="font-medium">
                      {walletService.formatAmount(fees.amount, fees.currency)} {fees.currency}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination:</span>
                    <span className="font-medium text-right max-w-xs truncate">
                      {formData.method === 'bank_transfer' 
                        ? `${formData.metadata.accountHolder} - ${formData.metadata.iban}`
                        : `${formData.metadata.address} (${formData.metadata.network})`
                      }
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">Total prélevé:</span>
                    <span className="font-bold">
                      {walletService.formatAmount(
                        parseFloat(formData.amount) + (fees?.currency === formData.currency ? fees.amount : 0),
                        formData.currency
                      )} {formData.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissements de sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-blue-800">
                    Sécurité
                  </h5>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Vérifiez que toutes les informations sont correctes</li>
                    <li>• Les retraits sont traités sous 1-3 jours ouvrables</li>
                    <li>• Vous recevrez une confirmation par email</li>
                    {formData.method === 'crypto_wallet' && (
                      <li>• Les transactions crypto sont irréversibles</li>
                    )}
                  </ul>
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
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Traitement...' : 'Confirmer le retrait'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;