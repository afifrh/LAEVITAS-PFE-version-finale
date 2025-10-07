import React, { useState } from 'react';
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import walletService from '../services/walletService';

// Modale de dépôt
export const DepositModal = ({ isOpen, onClose, onSuccess, balances }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    method: 'bank_transfer',
    bankAccount: {
      iban: '',
      bic: '',
      accountHolder: ''
    },
    cryptoWallet: {
      address: '',
      network: 'ethereum'
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currencies = walletService.getSupportedCurrencies();
  const methods = [
    { value: 'bank_transfer', label: 'Virement bancaire', icon: BanknotesIcon },
    { value: 'credit_card', label: 'Carte de crédit', icon: CreditCardIcon },
    { value: 'crypto_wallet', label: 'Portefeuille crypto', icon: BanknotesIcon }
  ];

  // Obtenir les méthodes de paiement avec leurs devises supportées
  const paymentMethods = walletService.getPaymentMethods('deposit');
  
  // Filtrer les devises selon la méthode sélectionnée
  const getAvailableCurrencies = () => {
    const selectedMethod = paymentMethods.find(method => method.id === formData.method);
    if (!selectedMethod) return currencies;
    
    return currencies.filter(currency => 
      selectedMethod.currencies.includes(currency.code)
    );
  };

  // Mettre à jour la devise si elle n'est plus supportée par la nouvelle méthode
  const handleMethodChange = (newMethod) => {
    const selectedMethodData = paymentMethods.find(method => method.id === newMethod);
    const availableCurrencies = selectedMethodData ? selectedMethodData.currencies : [];
    
    // Si la devise actuelle n'est pas supportée par la nouvelle méthode, prendre la première disponible
    const currentCurrency = formData.currency;
    const newCurrency = availableCurrencies.includes(currentCurrency) 
      ? currentCurrency 
      : availableCurrencies[0] || 'USD';
    
    setFormData({ 
      ...formData, 
      method: newMethod,
      currency: newCurrency
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Montant invalide';
    }

    if (parseFloat(formData.amount) > 50000) {
      newErrors.amount = 'Montant trop élevé (max: 50,000)';
    }

    if (formData.method === 'bank_transfer') {
      if (!formData.bankAccount.iban) newErrors.iban = 'IBAN requis';
      if (!formData.bankAccount.bic) newErrors.bic = 'BIC requis';
      if (!formData.bankAccount.accountHolder) newErrors.accountHolder = 'Titulaire du compte requis';
    }

    if (formData.method === 'crypto_wallet') {
      if (!formData.cryptoWallet.address) newErrors.address = 'Adresse du portefeuille requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const metadata = formData.method === 'bank_transfer' 
        ? { bankAccount: formData.bankAccount }
        : formData.method === 'crypto_wallet'
        ? { cryptoWallet: formData.cryptoWallet }
        : {};

      const result = await walletService.deposit({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        method: formData.method,
        metadata
      });

      onSuccess(result);
      onClose();
      
      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        method: 'bank_transfer',
        bankAccount: { iban: '', bic: '', accountHolder: '' },
        cryptoWallet: { address: '', network: 'ethereum' }
      });
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Erreur lors du dépôt' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Effectuer un dépôt</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Montant
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: '1000' })}
                  className="absolute right-2 top-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  1000
                </button>
              </div>
              {errors.amount && (
                <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Devise */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Devise
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {getAvailableCurrencies().map(currency => (
                  <option key={currency.code} value={currency.code} className="bg-gray-800 text-white">
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-400 mt-1">
                Sélectionnez la devise pour votre dépôt
              </p>
            </div>

            {/* Méthode de paiement */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Méthode de paiement
              </label>
              <div className="space-y-2">
                {methods.map(method => (
                  <label key={method.value} className="flex items-center p-3 border border-gray-600 bg-gray-800/50 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <input
                      type="radio"
                      name="method"
                      value={method.value}
                      checked={formData.method === method.value}
                      onChange={(e) => handleMethodChange(e.target.value)}
                      className="mr-3 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                    />
                    <method.icon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-sm font-medium text-white">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Détails bancaires */}
            {formData.method === 'bank_transfer' && (
              <div className="space-y-3 p-4 bg-gray-800/30 border border-gray-600/50 rounded-md">
                <h4 className="font-medium text-white">Détails bancaires</h4>
                <div>
                  <input
                    type="text"
                    placeholder="IBAN"
                    value={formData.bankAccount.iban}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, iban: e.target.value }
                    })}
                    className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.iban ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.iban && <p className="text-red-400 text-sm mt-1">{errors.iban}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="BIC/SWIFT"
                    value={formData.bankAccount.bic}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, bic: e.target.value }
                    })}
                    className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.bic ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.bic && <p className="text-red-400 text-sm mt-1">{errors.bic}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Titulaire du compte"
                    value={formData.bankAccount.accountHolder}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount, accountHolder: e.target.value }
                    })}
                    className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.accountHolder ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.accountHolder && <p className="text-red-400 text-sm mt-1">{errors.accountHolder}</p>}
                </div>
              </div>
            )}

            {/* Détails crypto */}
            {formData.method === 'crypto_wallet' && (
              <div className="space-y-3 p-4 bg-gray-800/30 border border-gray-600/50 rounded-md">
                <h4 className="font-medium text-white">Détails du portefeuille crypto</h4>
                <div>
                  <select
                    value={formData.cryptoWallet.network}
                    onChange={(e) => setFormData({
                      ...formData,
                      cryptoWallet: { ...formData.cryptoWallet, network: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                  >
                    <option value="ethereum" className="bg-gray-800 text-white">Ethereum</option>
                    <option value="bitcoin" className="bg-gray-800 text-white">Bitcoin</option>
                    <option value="binance" className="bg-gray-800 text-white">Binance Smart Chain</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Adresse du portefeuille"
                    value={formData.cryptoWallet.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      cryptoWallet: { ...formData.cryptoWallet, address: e.target.value }
                    })}
                    className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
                </div>
              </div>
            )}

            {/* Informations importantes */}
            <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">Informations importantes :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Les dépôts sont traités sous 5-10 minutes</li>
                    <li>Frais de traitement : 0.5% (min. 1 USD)</li>
                    <li>Limite quotidienne : 10,000 USD</li>
                  </ul>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-300">{errors.submit}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Traitement...' : 'Confirmer le dépôt'}
              </button>
            </div>
           </form>
         </div>
       </div>
     </div>
   );
 };

 // Modale de retrait
export const WithdrawModal = ({ isOpen, onClose, onSuccess, balances }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    method: 'bank_transfer',
    bankAccount: {
      iban: '',
      bic: '',
      accountHolder: ''
    },
    cryptoWallet: {
      address: '',
      network: 'ethereum'
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currencies = walletService.getSupportedCurrencies();
  const methods = [
    { value: 'bank_transfer', label: 'Virement bancaire', icon: BanknotesIcon },
    { value: 'crypto_wallet', label: 'Portefeuille crypto', icon: BanknotesIcon }
  ];

  // Obtenir les méthodes de paiement avec leurs devises supportées
  const paymentMethods = walletService.getPaymentMethods('withdrawal');
  
  // Filtrer les devises selon la méthode sélectionnée
  const getAvailableCurrencies = () => {
    const selectedMethod = paymentMethods.find(method => method.id === formData.method);
    if (!selectedMethod) return currencies;
    
    return currencies.filter(currency => 
      selectedMethod.currencies.includes(currency.code)
    );
  };

  // Mettre à jour la devise si elle n'est plus supportée par la nouvelle méthode
  const handleMethodChange = (newMethod) => {
    const selectedMethodData = paymentMethods.find(method => method.id === newMethod);
    const availableCurrencies = selectedMethodData ? selectedMethodData.currencies : [];
    
    // Si la devise actuelle n'est pas supportée par la nouvelle méthode, prendre la première disponible
    const currentCurrency = formData.currency;
    const newCurrency = availableCurrencies.includes(currentCurrency) 
      ? currentCurrency 
      : availableCurrencies[0] || 'USD';
    
    setFormData({ 
      ...formData, 
      method: newMethod,
      currency: newCurrency
    });
  };

  const getAvailableBalance = (currency) => {
    const balance = balances?.find(b => b.currency === currency);
    return balance ? balance.available : 0;
  };

  const validateForm = () => {
    const newErrors = {};
    const amount = parseFloat(formData.amount);
    const availableBalance = getAvailableBalance(formData.currency);

    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Montant invalide';
    } else if (amount > availableBalance) {
      newErrors.amount = 'Solde insuffisant';
    }

    if (amount < 10) {
      newErrors.amount = 'Montant minimum : 10 USD';
    }

    if (formData.method === 'bank_transfer') {
      if (!formData.bankAccount.iban) newErrors.iban = 'IBAN requis';
      if (!formData.bankAccount.bic) newErrors.bic = 'BIC requis';
      if (!formData.bankAccount.accountHolder) newErrors.accountHolder = 'Titulaire du compte requis';
    }

    if (formData.method === 'crypto_wallet') {
      if (!formData.cryptoWallet.address) newErrors.address = 'Adresse du portefeuille requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const metadata = formData.method === 'bank_transfer' 
        ? { bankAccount: formData.bankAccount }
        : { cryptoWallet: formData.cryptoWallet };

      const result = await walletService.withdraw({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        method: formData.method,
        metadata
      });

      onSuccess(result);
      onClose();
      
      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        method: 'bank_transfer',
        bankAccount: { iban: '', bic: '', accountHolder: '' },
        cryptoWallet: { address: '', network: 'ethereum' }
      });
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Erreur lors du retrait' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableBalance = getAvailableBalance(formData.currency);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Effectuer un retrait</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Devise */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Devise
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getAvailableCurrencies().map(currency => (
                <option key={currency.code} value={currency.code} className="bg-gray-800 text-white">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-400 mt-1">
              Solde disponible : {walletService.formatAmount(availableBalance, formData.currency)} {formData.currency}
            </p>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Montant
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="0.00"
                max={availableBalance}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: availableBalance.toString() })}
                className="absolute right-2 top-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Max
              </button>
            </div>
            {errors.amount && (
              <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Méthode de retrait */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Méthode de retrait
            </label>
            <div className="space-y-2">
              {methods.map(method => (
                <label key={method.value} className="flex items-center p-3 border border-gray-600 bg-gray-800/50 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors">
                  <input
                    type="radio"
                    name="method"
                    value={method.value}
                    checked={formData.method === method.value}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="mr-3 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                  />
                  <method.icon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-white">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Détails bancaires */}
          {formData.method === 'bank_transfer' && (
            <div className="space-y-3 p-4 bg-gray-800/30 border border-gray-600/50 rounded-md">
              <h4 className="font-medium text-white">Détails bancaires</h4>
              <div>
                <input
                  type="text"
                  placeholder="IBAN"
                  value={formData.bankAccount.iban}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, iban: e.target.value }
                  })}
                  className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.iban ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.iban && <p className="text-red-400 text-sm mt-1">{errors.iban}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="BIC/SWIFT"
                  value={formData.bankAccount.bic}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, bic: e.target.value }
                  })}
                  className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.bic ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.bic && <p className="text-red-400 text-sm mt-1">{errors.bic}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Titulaire du compte"
                  value={formData.bankAccount.accountHolder}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, accountHolder: e.target.value }
                  })}
                  className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountHolder ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.accountHolder && <p className="text-red-400 text-sm mt-1">{errors.accountHolder}</p>}
              </div>
            </div>
          )}

          {/* Détails crypto */}
          {formData.method === 'crypto_wallet' && (
            <div className="space-y-3 p-4 bg-gray-800/30 border border-gray-600/50 rounded-md">
              <h4 className="font-medium text-white">Détails du portefeuille crypto</h4>
              <div>
                <select
                  value={formData.cryptoWallet.network}
                  onChange={(e) => setFormData({
                    ...formData,
                    cryptoWallet: { ...formData.cryptoWallet, network: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                >
                  <option value="ethereum" className="bg-gray-800 text-white">Ethereum</option>
                  <option value="bitcoin" className="bg-gray-800 text-white">Bitcoin</option>
                  <option value="binance" className="bg-gray-800 text-white">Binance Smart Chain</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Adresse du portefeuille"
                  value={formData.cryptoWallet.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    cryptoWallet: { ...formData.cryptoWallet, address: e.target.value }
                  })}
                  className={`w-full px-3 py-2 bg-gray-800 border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          )}

          {/* Informations importantes */}
          <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">Informations importantes :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Les retraits sont traités sous 24-48h</li>
                  <li>Frais de retrait : 1% (min. 5 USD)</li>
                  <li>Montant minimum : 10 USD</li>
                  <li>Limite quotidienne : 5,000 USD</li>
                </ul>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || availableBalance === 0}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Traitement...' : 'Confirmer le retrait'}
            </button>
          </div>
           </form>
         </div>
       </div>
     </div>
   );
 };