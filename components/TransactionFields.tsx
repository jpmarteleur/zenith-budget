import React, { useEffect, useId, useRef } from 'react';
import type { CategoryName, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import type { TransactionDraft } from '../utils/transactions';
import { transactionMonthBounds } from '../utils/transactions';
import { useSettings } from '../contexts/SettingsContext';

export const TRANSACTION_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
export const TRANSACTION_PRIMARY = `min-h-12 rounded-xl bg-house-green px-5 py-3 text-sm font-semibold text-white hover:bg-green-uplift disabled:cursor-not-allowed disabled:opacity-50 ${TRANSACTION_FOCUS}`;
export const TRANSACTION_SECONDARY = `min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${TRANSACTION_FOCUS}`;
const FIELD = `min-h-12 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-base text-black/87 ${TRANSACTION_FOCUS}`;

interface TransactionFieldsProps {
  draft: TransactionDraft;
  onChange: (patch: Partial<TransactionDraft>) => void;
  selectedMonth: string;
  subcategories: Subcategories;
  creatingNew?: boolean;
  onCreatingChange?: (creating: boolean) => void;
  plannedAmount?: string;
  onPlannedAmountChange?: (amount: string) => void;
  retainedSubcategory?: { category: CategoryName; name: string };
  amountRef?: React.RefObject<HTMLInputElement | null>;
}

const TransactionFields: React.FC<TransactionFieldsProps> = ({
  draft, onChange, selectedMonth, subcategories, creatingNew = false, onCreatingChange,
  plannedAmount, onPlannedAmountChange, retainedSubcategory, amountRef,
}) => {
  const id = useId();
  const { currency } = useSettings();
  const bounds = transactionMonthBounds(selectedMonth);
  const nameRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const previouslyCreating = useRef(false);
  useEffect(() => {
    if (creatingNew) nameRef.current?.focus();
    else if (previouslyCreating.current) selectRef.current?.focus();
    previouslyCreating.current = creatingNew;
  }, [creatingNew]);
  const options = subcategories[draft.category] || [];
  const historical = retainedSubcategory?.category === draft.category && !options.some(sub => sub.name === retainedSubcategory.name);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor={`${id}-amount`} className="text-sm font-medium text-black/87">Amount</label>
          <span className="text-xs text-black/60">{currency.code}</span>
        </div>
        <input ref={amountRef} id={`${id}-amount`} type="number" inputMode="decimal" step="any" required value={draft.amount} onChange={event => onChange({ amount: event.target.value })} className={`min-h-16 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-3xl font-semibold tabular-nums text-black/87 ${TRANSACTION_FOCUS}`} />
      </div>
      <div>
        <label htmlFor={`${id}-category`} className="mb-2 block text-sm font-medium text-black/87">Category</label>
        <select id={`${id}-category`} value={draft.category} onChange={event => { onChange({ category: event.target.value as CategoryName, subcategory: '' }); onCreatingChange?.(false); }} className={FIELD} required>
          {CATEGORY_NAMES.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-subcategory`} className="mb-2 block text-sm font-medium text-black/87">{creatingNew ? 'New subcategory name' : 'Subcategory'}</label>
        {creatingNew ? (
          <div className="space-y-3">
            <input ref={nameRef} id={`${id}-subcategory`} value={draft.subcategory} onChange={event => onChange({ subcategory: event.target.value })} required className={FIELD} />
            {onPlannedAmountChange && <div>
              <label htmlFor={`${id}-planned`} className="mb-2 block text-sm font-medium text-black/87">Planned amount (optional)</label>
              <input id={`${id}-planned`} type="number" inputMode="decimal" step="0.01" value={plannedAmount ?? ''} onChange={event => onPlannedAmountChange(event.target.value)} placeholder="0.00" className={FIELD} />
              <p className="mt-2 text-xs leading-relaxed text-black/60">This sets the new subcategory's monthly plan. It does not change the transaction amount.</p>
            </div>}
            <button type="button" onClick={() => { onCreatingChange?.(false); onChange({ subcategory: '' }); }} className={`min-h-11 rounded-lg px-1 text-sm font-semibold text-green-accent ${TRANSACTION_FOCUS}`}>Choose an existing subcategory</button>
          </div>
        ) : (
          <>
            <select ref={selectRef} id={`${id}-subcategory`} value={draft.subcategory} onChange={event => onChange({ subcategory: event.target.value })} required className={FIELD}>
              <option value="" disabled>Choose a subcategory</option>
              {historical && <option value={retainedSubcategory.name}>{retainedSubcategory.name} (from history)</option>}
              {onCreatingChange && !historical && draft.subcategory && !options.some(sub => sub.name === draft.subcategory) && <option value={draft.subcategory}>{draft.subcategory}</option>}
              {options.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
            </select>
            {onCreatingChange && <button type="button" onClick={() => { onCreatingChange(true); onChange({ subcategory: '' }); }} className={`mt-1 min-h-11 rounded-lg px-1 text-sm font-semibold text-green-accent ${TRANSACTION_FOCUS}`}>Create a subcategory</button>}
          </>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-date`} className="mb-2 block text-sm font-medium text-black/87">Date</label>
        <input id={`${id}-date`} type="date" required min={bounds.min} max={bounds.max} value={draft.date} onChange={event => onChange({ date: event.target.value })} className={FIELD} aria-describedby={`${id}-date-hint`} />
        <p id={`${id}-date-hint`} className="mt-2 text-xs text-black/60">Keep this transaction within the selected budget month.</p>
      </div>
      <div>
        <label htmlFor={`${id}-note`} className="mb-2 block text-sm font-medium text-black/87">Description</label>
        <textarea id={`${id}-note`} rows={2} value={draft.note} onChange={event => onChange({ note: event.target.value })} className={`${FIELD} resize-y`} placeholder="Optional description" />
      </div>
    </div>
  );
};
export default TransactionFields;
