import React, { useRef, useState } from 'react';
import { useSettings, CURRENCIES, CurrencyCode } from '../contexts/SettingsContext';
import type { useRecurring } from '../hooks/useRecurring';
import type { Subcategories } from '../types';
import { useAuth } from '../hooks/useAuth';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import HowToPage from './HowToPage';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import LogoutIcon from '../components/icons/LogoutIcon';
import RecurringRulesCard from '../components/RecurringRulesCard';

type SettingsPageProps = ReturnType<typeof useRecurring> & { subcategories: Subcategories; openRecurring?: boolean };
const SettingsPage: React.FC<SettingsPageProps> = props => {
  const { currency, setCurrency, currencyError } = useSettings();
  const { currentUser, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const signingOut = useRef(false);
  const handleLogout = async () => {
    if (signingOut.current) return;
    signingOut.current = true; setIsSigningOut(true); setAccountError(null);
    try { await logout(); }
    catch { setAccountError('Could not sign out. Please try again.'); }
    finally { signingOut.current = false; setIsSigningOut(false); }
  };
  const summaryClass = 'flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-base font-semibold text-house-green hover:bg-green-mint/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-house-green [&::-webkit-details-marker]:hidden';
  return <div className="mx-auto max-w-4xl space-y-4">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-house-green">Settings</h1>
      <p className="mt-2 text-sm text-black/60">Preferences, recurring transactions, and help.</p>
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
    <details open={props.openRecurring || !!props.recurringLoadError} className="group rounded-2xl border border-black/10 bg-white">
      <summary className={summaryClass}>Recurring transactions<ChevronDownIcon className="h-4 w-4 shrink-0 group-open:rotate-180" /></summary>
      <RecurringRulesCard {...props} />
    </details>
    <details className="group rounded-2xl border border-black/10 bg-white">
      <summary className={summaryClass}>Help &amp; budget setup<ChevronDownIcon className="h-4 w-4 shrink-0 group-open:rotate-180" /></summary>
      <div className="border-t border-black/10 p-4 sm:p-6"><HowToPage embedded /></div>
    </details>
    <section aria-labelledby="account-title" className="space-y-3 rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
        <h2 id="account-title" className="text-lg font-semibold tracking-tight text-house-green">Account</h2>
        <p className="break-words text-sm text-black/60">{currentUser?.id === GUEST_USER_ID ? 'Guest session' : currentUser?.email}</p>
        {currentUser?.id === GUEST_USER_ID && <p className="text-sm leading-relaxed text-black/60">Your guest data is stored in this browser. Signing out clears guest budgets and recurring rules.</p>}
        <button type="button" onClick={handleLogout} disabled={isSigningOut} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-danger/30 px-4 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green">
          <LogoutIcon className="h-4 w-4" />{isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
        {accountError && <p role="alert" className="text-sm text-danger">{accountError}</p>}
    </section>
  </div>;
};
export default SettingsPage;
