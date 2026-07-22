import React from 'react';
import { useSettings, CURRENCIES, CurrencyCode } from '../contexts/SettingsContext';
import { CARD_STYLE, INPUT_STYLE } from '../constants';

const SettingsPage: React.FC = () => {
  const { currency, setCurrency } = useSettings();

  return (
    <div className="space-y-6">
      <div className={`${CARD_STYLE} p-6`}>
        <h2 className="text-xl font-bold text-black/87 mb-4">General Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="currency-select" className="block text-sm font-medium text-black/70 mb-2">
              Currency
            </label>
            <select
              id="currency-select"
              value={currency.code}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className={`${INPUT_STYLE} md:w-64`}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-black/60">
              Select the currency you want to use for your budget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
