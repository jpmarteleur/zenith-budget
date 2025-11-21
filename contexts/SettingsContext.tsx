import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CNY' | 'INR' | 'BRL';

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
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
];

interface SettingsContextType {
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('zenith_currency');
    if (savedCurrency && CURRENCIES.some(c => c.code === savedCurrency)) {
      setCurrencyCode(savedCurrency as CurrencyCode);
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyCode(code);
    localStorage.setItem('zenith_currency', code);
  };

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
    }).format(amount);
  };

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, formatCurrency }}>
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
