import React, { useEffect, useRef, useState } from 'react';
import type { Page } from '../MainApp';
import type { useBudget } from '../hooks/useBudget';
import NewMonthModal from './NewMonthModal';
import Dialog from './Dialog';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
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
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthSelectRef = useRef<HTMLButtonElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const months = [...availableMonths].sort().reverse();
  const monthIndex = months.indexOf(selectedMonth);
  const showMonths = activePage === 'Budget';
  const nextMonth = getNextMonth(months[0] || selectedMonth);

  useEffect(() => {
    if (!isMonthOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !monthPickerRef.current?.contains(event.target)) setIsMonthOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [isMonthOpen]);

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

  return (
    <>
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 ${FOCUS}`}>Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          {showMonths ? <div ref={monthPickerRef} className="relative min-w-0" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsMonthOpen(false);
          }} onKeyDown={event => {
            if (event.key === 'Escape') {
              setIsMonthOpen(false);
              monthSelectRef.current?.focus();
            }
          }}>
            <button ref={monthSelectRef} type="button" aria-expanded={isMonthOpen} aria-controls="budget-month-options" aria-label={`Budget month: ${monthIndex >= 0 ? formatMonth(selectedMonth) : 'No budget months'}`} disabled={!isBudgetLoaded} onClick={() => setIsMonthOpen(open => !open)} className={`inline-flex min-h-11 max-w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-house-green hover:bg-green-mint/40 disabled:opacity-60 ${FOCUS}`}>
              <span className="truncate">{!isBudgetLoaded ? 'Loading months…' : monthIndex >= 0 ? formatMonth(selectedMonth) : 'Choose a month'}</span>
              <ChevronDownIcon className={`h-4 w-4 shrink-0 ${isMonthOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMonthOpen && <div id="budget-month-options" className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/20 bg-white p-2 shadow-lg">
              <button type="button" onClick={() => { setIsMonthOpen(false); setIsModalOpen(true); }} className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-house-green hover:bg-green-mint/50 ${FOCUS}`}>
                <PlusIcon className="h-4 w-4" />Create new month
              </button>
              <ul aria-label="Budget months" className="max-h-[min(50dvh,20rem)] overflow-y-auto border-t border-black/10 py-1">
                {months.map(month => <li key={month}><button type="button" aria-current={month === selectedMonth ? 'true' : undefined} onClick={() => {
                  setSelectedMonth(month); setIsMonthOpen(false); monthSelectRef.current?.focus();
                }} className={`min-h-11 w-full rounded-lg px-3 text-left text-sm ${FOCUS} ${month === selectedMonth ? 'bg-green-mint/60 font-semibold text-house-green' : 'text-black/70 hover:bg-black/5'}`}>{formatMonth(month)}{month === selectedMonth && <span className="sr-only">, selected</span>}</button></li>)}
                {!months.length && <li className="px-3 py-3 text-sm text-black/60">No budget months yet.</li>}
              </ul>
              {months.length > 1 && monthIndex >= 0 && <button type="button" onClick={() => { setIsMonthOpen(false); setDeleteTarget(selectedMonth); setDeleteError(null); }} className={`flex min-h-11 w-full items-center gap-2 rounded-lg border-t border-black/10 px-3 text-left text-sm text-danger hover:bg-danger/5 ${FOCUS}`}>
                <TrashIcon className="h-4 w-4" />Delete selected month
              </button>}
            </div>}
          </div> : <button type="button" onClick={() => setActivePage('Budget')} className={`min-h-11 rounded-xl px-3 text-sm font-semibold text-house-green hover:bg-green-mint/40 ${FOCUS}`}><span aria-hidden="true">← </span>Back to budget</button>}
          {showMonths && <button type="button" aria-label="Settings" onClick={() => { setIsMonthOpen(false); setActivePage('Settings'); }} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-house-green hover:bg-green-mint/40 ${FOCUS}`}>
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m9.5 3-.6 2.3-1.5.9-2.3-.6-2.5 4.3 1.7 1.7v1.8l-1.7 1.7 2.5 4.3 2.3-.6 1.5.9.6 2.3h5l.6-2.3 1.5-.9 2.3.6 2.5-4.3-1.7-1.7v-1.8l1.7-1.7-2.5-4.3-2.3.6-1.5-.9L14.5 3z"/><circle cx="12" cy="12.5" r="3"/></svg>
          </button>}
        </nav>
        {showMonths && <span role="status" className="sr-only">{monthIndex >= 0 ? formatMonth(selectedMonth) : ''}</span>}
      </header>
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
