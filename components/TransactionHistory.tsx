import React, { useMemo, useRef, useState } from 'react';
import type { Transaction, Subcategories } from '../types';
import type { TransactionWriteResult } from '../hooks/useBudget';
import { getCategoryColor } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import Dialog from './Dialog';
import TransactionEditor from './TransactionEditor';
import CategoryIcon from './CategoryIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import { TRANSACTION_FOCUS, TRANSACTION_PRIMARY, TRANSACTION_SECONDARY } from './TransactionFields';

interface TransactionHistoryProps {
  transactions: Transaction[];
  pendingRecurringCount: number | null;
  onReviewRecurring: () => void;
  selectedMonth: string;
  updateTransaction: (transaction: Transaction) => Promise<TransactionWriteResult>;
  deleteTransaction: (id: string) => Promise<TransactionWriteResult>;
  subcategories: Subcategories;
  onLogTransactionClick: () => void;
  addButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const displayDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, pendingRecurringCount, onReviewRecurring, selectedMonth, updateTransaction, deleteTransaction, subcategories, onLogTransactionClick, addButtonRef }) => {
  const { formatCurrency } = useSettings();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const dayGroups = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      const group = groups.get(transaction.date);
      if (group) group.push(transaction);
      else groups.set(transaction.date, [transaction]);
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);
  const confirmDelete = async () => {
    if (!deleting || busyRef.current || uncertain) return;
    busyRef.current = true; setBusy(true); setError(null);
    try {
      const result = await deleteTransaction(deleting.id);
      if (result.error) { setError(result.error); setUncertain(!!result.uncertain); }
      else setDeleting(null);
    } catch {
      setError('Could not confirm whether this transaction was deleted. Reload activity before trying again.');
      setUncertain(true);
    } finally { busyRef.current = false; setBusy(false); }
  };
  return (
    <section aria-labelledby="transaction-history-title" className="rounded-2xl border border-black/10 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4 sm:p-6">
        <div>
          <h2 id="transaction-history-title" className="text-lg font-semibold tracking-tight text-house-green">Transaction history</h2>
          <p className="mt-1 text-xs text-black/60">All recorded activity, grouped by day.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <button ref={addButtonRef} type="button" onClick={onLogTransactionClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-house-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-uplift ${TRANSACTION_FOCUS}`}>
          <PlusIcon className="h-4 w-4" />
          <span>{transactions.length ? 'Add transaction' : 'Add first transaction'}</span>
        </button>
          {pendingRecurringCount !== null && <button type="button" onClick={onReviewRecurring} aria-label={`Review recurring transactions, ${pendingRecurringCount} not yet applied this month`} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-house-green px-4 py-2 text-sm font-semibold text-house-green hover:bg-green-mint/50 ${TRANSACTION_FOCUS}`}>
            Recurring<span className="rounded-full bg-green-mint px-2 py-0.5 text-xs tabular-nums">{pendingRecurringCount}</span>
          </button>}
        </div>
      </header>
      {transactions.length === 0 ? <div className="px-5 py-8 text-center">
        <p className="text-sm font-medium text-black/87">No transactions yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-black/60">Add your first transaction to start tracking income and spending against your plan.</p>
      </div> : (
        <div className="px-4 pb-3 sm:px-6">
          {dayGroups.map(([date, entries]) => <section key={date} aria-label={displayDate(date)}>
            <h3 className="mt-4 rounded-lg bg-black/5 px-3 py-2 text-xs font-semibold text-black/70"><time dateTime={date}>{displayDate(date)}</time></h3>
            <ul className="divide-y divide-black/10">
              {entries.map(transaction => {
                const color = getCategoryColor(transaction.category).hex;
                return <li key={transaction.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)] gap-x-3 gap-y-2 py-3 md:grid-cols-[minmax(0,1fr)_8rem_auto] md:items-center md:gap-4">
                  <div className="order-1 min-w-0">
                    <p className="break-words text-sm font-semibold text-black/87">{transaction.subcategory}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-black/60">
                      <span style={{ color }}>
                        <CategoryIcon category={transaction.category} className="h-3.5 w-3.5" />
                      </span>{transaction.category}</div>
                    {transaction.note && <p className="mt-2 break-words text-sm leading-relaxed text-black/60">{transaction.note}</p>}
                  </div>
                  <p className={`order-2 min-w-0 break-all text-right text-sm font-semibold tabular-nums ${transaction.category === 'Income' ? 'text-green-accent' : 'text-black/87'}`}>{formatCurrency(transaction.amount)}</p>
                  <div className="order-4 col-span-2 flex justify-end gap-1 md:col-span-1">
                    <button type="button" onClick={() => setEditing(transaction)} aria-label={`Edit ${transaction.subcategory} transaction`} title="Edit transaction" className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-black/60 hover:bg-black/5 ${TRANSACTION_FOCUS}`}>
                      <span aria-hidden="true">
                        <PencilIcon className="h-4 w-4" />
                      </span>Edit
                    </button>
                    <button type="button" onClick={() => { setDeleting(transaction); setError(null); setUncertain(false); }} aria-label={`Delete ${transaction.subcategory} transaction`} title="Delete transaction" className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-danger hover:bg-danger/5 ${TRANSACTION_FOCUS}`}>
                      <span aria-hidden="true">
                        <TrashIcon className="h-4 w-4" />
                      </span>Delete
                    </button>
                  </div>
                </li>;
              })}
            </ul>
          </section>)}
        </div>
      )}
      {editing && <TransactionEditor transaction={editing} selectedMonth={selectedMonth} subcategories={subcategories} onSave={updateTransaction} onClose={() => setEditing(null)} returnFocusRef={addButtonRef} />}
      {deleting && <Dialog title="Delete transaction?" description="This permanently removes this recorded transaction." onClose={() => setDeleting(null)} busy={busy} returnFocusRef={addButtonRef} footer={
        <div className="flex flex-col gap-2">
          {uncertain ? <button type="button" onClick={() => window.location.reload()} className={TRANSACTION_PRIMARY}>Reload activity</button> : <button type="button" onClick={confirmDelete} disabled={busy} className={`min-h-12 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 ${TRANSACTION_FOCUS}`}>{busy ? 'Deleting…' : 'Delete transaction'}</button>}
          <button type="button" onClick={() => setDeleting(null)} disabled={busy} className={TRANSACTION_SECONDARY}>{uncertain ? 'Close' : 'Keep transaction'}</button>
        </div>
      }>
        {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
        <div className="rounded-xl bg-black/5 p-4">
          <p className="break-words text-sm font-semibold text-black/87">{deleting.subcategory}</p>
          <p className="mt-1 text-sm text-black/60">{deleting.category} · {displayDate(deleting.date)}</p>
          <p className="mt-3 text-xl font-semibold tabular-nums text-house-green">{formatCurrency(deleting.amount)}</p>{deleting.note && <p className="mt-2 break-words text-sm text-black/60">{deleting.note}</p>}</div>
        {deleting.recurring_id && <p className="mt-4 text-sm leading-relaxed text-black/60">The recurring rule stays unchanged.</p>}
        {busy && <p role="status" className="sr-only">Deleting your transaction.</p>}
      </Dialog>}
    </section>
  );
};
export default TransactionHistory;
