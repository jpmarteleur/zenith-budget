import React from 'react';
import { useSettings, CURRENCIES, CurrencyCode } from '../contexts/SettingsContext';
import { FUTURISTIC_GLASS_STYLE } from '../constants';

const SettingsPage: React.FC = () => {
  const { currency, setCurrency } = useSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      
      <div className={`${FUTURISTIC_GLASS_STYLE} p-6`}>
        <h2 className="text-xl font-bold text-white mb-4">General Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="currency-select" className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              id="currency-select"
              value={currency.code}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full md:w-64 bg-gray-800/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-400">
              Select the currency you want to use for your budget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
