import React from 'react';
import { useSettings, CURRENCIES, CurrencyCode } from '../contexts/SettingsContext';
import type { useRecurring } from '../hooks/useRecurring';
import type { Subcategories } from '../types';
import RecurringRulesCard from '../components/RecurringRulesCard';

type SettingsPageProps = ReturnType<typeof useRecurring> & { subcategories: Subcategories };
const SettingsPage: React.FC<SettingsPageProps> = props => {
  const { currency, setCurrency, currencyError } = useSettings();
  return <div className="mx-auto max-w-4xl space-y-6">
    <header>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-house-green">Settings</h1>
      <p className="mt-2 text-sm text-black/60">Your display preferences and regular monthly activity.</p>
    </header>
    <section aria-labelledby="currency-title" className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center">
        <div>
          <h2 id="currency-title" className="text-lg font-semibold tracking-tight text-house-green">Currency</h2>
          <p id="currency-help" className="mt-1 text-sm leading-relaxed text-black/60">Changes how amounts are displayed. Your stored amounts stay the same, with no exchange-rate conversion. Saved on this device.</p>
        </div>
        <div className="min-w-0">
          <label htmlFor="currency-select" className="mb-2 block text-sm font-medium">Display currency</label>
          <select id="currency-select" value={currency.code} onChange={e => setCurrency(e.target.value as CurrencyCode)} aria-describedby="currency-help" className="min-h-12 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green">
            {CURRENCIES.map(currency => <option key={currency.code} value={currency.code}>{currency.name} ({currency.symbol})</option>)}
          </select>
        </div>
      </div>
      {currencyError && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{currencyError}</p>}
    </section>
    <RecurringRulesCard {...props} />
  </div>;
};
export default SettingsPage;
