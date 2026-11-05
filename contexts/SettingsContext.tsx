import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
];

interface SettingsContextType {
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  currencyError: string | null;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');

  const [currencyError, setCurrencyError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('zenith_currency');
      if (savedCurrency && CURRENCIES.some(c => c.code === savedCurrency)) {
        setCurrencyCode(savedCurrency as CurrencyCode);
      }
    } catch { setCurrencyError('Could not read your saved currency. USD is shown until you choose and save a currency.'); }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    try {
      localStorage.setItem('zenith_currency', code);
      setCurrencyCode(code);
      setCurrencyError(null);
    } catch { setCurrencyError('Could not save your currency on this device. Your previous currency is still selected. Check browser storage and try again.'); }
  };

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
    }).format(amount);
  };

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, currencyError, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
