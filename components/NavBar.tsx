import React, { useRef, useState } from 'react';
import type { Page } from '../MainApp';
import type { useBudget } from '../hooks/useBudget';
import NewMonthModal from './NewMonthModal';
import Dialog from './Dialog';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TrashIcon from './icons/TrashIcon';
import LogoutIcon from './icons/LogoutIcon';
import PlusIcon from './icons/PlusIcon';
import { useAuth } from '../hooks/useAuth';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import type { RecurringRule, Subcategories } from '../types';

interface NavBarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  createNewMonth: ReturnType<typeof useBudget>['createNewMonth'];
  deleteMonth: ReturnType<typeof useBudget>['deleteMonth'];
  activeRecurringRules: RecurringRule[];
  subcategoriesByMonth: Record<string, Subcategories>;
  isBudgetLoaded: boolean;
}

const formatMonth = (month: string) => {
  if (!month) return '';
  const [year, number] = month.split('-').map(Number);
  return new Date(year, number - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const getNextMonth = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(year, number, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
const SECONDARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/20 bg-white px-4 text-sm font-semibold text-house-green transition-colors hover:bg-green-mint/40 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;

const NavBar: React.FC<NavBarProps> = ({
  activePage, setActivePage, selectedMonth, setSelectedMonth, availableMonths,
  createNewMonth, deleteMonth, activeRecurringRules, subcategoriesByMonth, isBudgetLoaded,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const monthSelectRef = useRef<HTMLSelectElement>(null);
  const { currentUser, logout } = useAuth();
  const pages: Page[] = ['Budget', 'How To', 'Settings'];
  const months = [...availableMonths].sort();
  const monthIndex = months.indexOf(selectedMonth);
  const showMonths = activePage === 'Budget';
  const nextMonth = getNextMonth(months[months.length - 1] || selectedMonth);
  const accountLabel = currentUser?.id === GUEST_USER_ID ? 'Guest session' : currentUser?.email;

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteMonth(deleteTarget);
      if (result.error) setDeleteError(result.error);
      else setDeleteTarget(null);
    } catch {
      setDeleteError('Could not finish deleting this month. Reload to check its status before trying again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setAccountError(null);
    setIsSigningOut(true);
    try {
      await logout();
    } catch {
      setAccountError('Could not sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 ${FOCUS}`}>Skip to content</a>
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-house-green">Zenith</h1>
              <p className="mt-0.5 text-sm text-black/60">Budget</p>
            </div>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="max-w-32 truncate text-xs text-black/60 sm:max-w-xs sm:text-sm" title={accountLabel}>{accountLabel}</span>
              <button type="button" onClick={handleLogout} disabled={isSigningOut} aria-label={isSigningOut ? 'Signing out' : 'Sign out'} title="Sign out" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black/60 hover:bg-black/5 disabled:opacity-40 ${FOCUS}`}>
                <span aria-hidden="true"><LogoutIcon className="h-5 w-5" /></span>
              </button>
            </div>
          </div>
          {accountError && <p role="alert" className="mt-3 text-sm text-danger">{accountError}</p>}
          <nav aria-label="Main navigation" className="-ml-2 mt-4 flex flex-wrap gap-1 pb-3">
            {pages.map(page => (
              <button key={page} type="button" onClick={() => setActivePage(page)} aria-current={activePage === page ? 'page' : undefined} className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors sm:px-4 ${FOCUS} ${activePage === page ? 'bg-green-mint/60 text-house-green' : 'text-black/60 hover:bg-black/5 hover:text-house-green'}`}>
                {page}
              </button>
            ))}
          </nav>
        </div>
      </header>
      {showMonths && (
        <section aria-label="Budget month controls" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 py-5">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button type="button" aria-label="Previous budget month" disabled={!isBudgetLoaded || monthIndex <= 0} onClick={() => setSelectedMonth(months[monthIndex - 1])} className={`${SECONDARY} w-11 shrink-0 px-0`}>
                <span aria-hidden="true"><ChevronDownIcon className="h-5 w-5 rotate-90" /></span>
              </button>
              <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none">
                <label htmlFor="budget-month" className="sr-only">Budget month</label>
                <select id="budget-month" ref={monthSelectRef} value={monthIndex >= 0 ? selectedMonth : ''} disabled={!isBudgetLoaded || months.length === 0} onChange={event => setSelectedMonth(event.target.value)} className={`h-11 w-full appearance-none rounded-xl border border-transparent bg-transparent py-2 pl-3 pr-9 text-center text-base font-semibold text-house-green hover:bg-white disabled:opacity-60 ${FOCUS}`}>
                  {(monthIndex < 0 || months.length === 0) && <option value="">{isBudgetLoaded ? 'No budget months' : 'Loading months…'}</option>}
                  {months.map(month => <option key={month} value={month}>{formatMonth(month)}</option>)}
                </select>
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-black/60"><ChevronDownIcon className="h-4 w-4" /></span>
              </div>
              <button type="button" aria-label="Next budget month" disabled={!isBudgetLoaded || monthIndex < 0 || monthIndex >= months.length - 1} onClick={() => setSelectedMonth(months[monthIndex + 1])} className={`${SECONDARY} w-11 shrink-0 px-0`}>
                <span aria-hidden="true"><ChevronDownIcon className="h-5 w-5 -rotate-90" /></span>
              </button>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button type="button" onClick={() => setIsModalOpen(true)} disabled={!isBudgetLoaded} className={`${SECONDARY} flex-1 sm:flex-none`}>
                <span aria-hidden="true"><PlusIcon className="h-4 w-4" /></span>New month
              </button>
              {months.length > 1 && monthIndex >= 0 && (
                <button type="button" onClick={() => { setDeleteTarget(selectedMonth); setDeleteError(null); }} aria-label="Delete selected month" title="Delete selected month" className={`${SECONDARY} w-11 shrink-0 px-0 text-danger hover:bg-danger/5`}>
                  <span aria-hidden="true"><TrashIcon className="h-4 w-4" /></span>
                </button>
              )}
            </div>
          </div>
          <span role="status" className="sr-only">{monthIndex >= 0 ? formatMonth(selectedMonth) : ''}</span>
        </section>
      )}
      {isModalOpen && (
        <NewMonthModal
          onClose={() => setIsModalOpen(false)}
          onCreate={createNewMonth}
          onCreated={month => { setSelectedMonth(month); setIsModalOpen(false); }}
          month={nextMonth}
          availableMonths={availableMonths}
          activeRecurringRules={activeRecurringRules}
          subcategoriesByMonth={subcategoriesByMonth}
          returnFocusRef={monthSelectRef}
        />
      )}
      {deleteTarget && (
        <Dialog title="Delete budget month?" description={formatMonth(deleteTarget)} onClose={() => setDeleteTarget(null)} busy={isDeleting} returnFocusRef={monthSelectRef} footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className={`${SECONDARY} flex-1`}>Keep month</button>
            <button type="button" onClick={handleDelete} disabled={isDeleting} className={`min-h-11 flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 ${FOCUS}`}>{isDeleting ? 'Deleting…' : 'Delete month'}</button>
          </div>
        }>
          <p className="text-sm leading-relaxed text-black/70">This permanently removes this month's budget and its transactions. This action cannot be undone.</p>
          {deleteError && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{deleteError}</p>}
        </Dialog>
      )}
    </>
  );
};

export default NavBar;
