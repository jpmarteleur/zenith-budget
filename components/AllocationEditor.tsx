import React, { useEffect, useId, useRef, useState } from 'react';
import type { CategoryName, Subcategory } from '../types';
import type { BudgetWriteResult } from '../hooks/useBudget';
import { useSettings } from '../contexts/SettingsContext';
import { getCategoryColor } from '../constants';
import { planningBalanceAfterEdit, planStatus } from '../utils/budget-presentation';
import Dialog from './Dialog';
import CategoryIcon from './CategoryIcon';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
const FIELD = `min-h-12 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-black/87 ${FOCUS}`;

interface AllocationEditorProps {
  category: CategoryName;
  subcategory?: Subcategory;
  balance: number;
  onSave: (expected: number, excluded: boolean) => Promise<BudgetWriteResult>;
  onAdd: (name: string, expected: number) => Promise<BudgetWriteResult>;
  onDelete: () => Promise<BudgetWriteResult>;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

const AllocationEditor: React.FC<AllocationEditorProps> = ({ category, subcategory, balance, onSave, onAdd, onDelete, onClose, returnFocusRef }) => {
  const { formatCurrency } = useSettings();
  const formId = useId();
  const [amount, setAmount] = useState(String(subcategory?.expected ?? 0));
  const [name, setName] = useState('');
  const [excluded, setExcluded] = useState(!!subcategory?.excludeFromBudget);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const keepButtonRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirmDelete) keepButtonRef.current?.focus();
    else if (wasConfirming.current) deleteButtonRef.current?.focus();
    wasConfirming.current = confirmDelete;
  }, [confirmDelete]);
  const value = Number(amount);
  const validAmount = amount.trim() !== '' && Number.isFinite(value);
  const nextBalance = validAmount ? planningBalanceAfterEdit(balance, category, subcategory, value, excluded) : null;
  const nextStatus = nextBalance === null ? null : planStatus(nextBalance);
  const color = getCategoryColor(category).hex;
  const title = confirmDelete ? 'Delete subcategory?' : subcategory ? 'Edit allocation' : category === 'Income' ? 'Add income source' : 'Add subcategory';

  const perform = async (action: () => Promise<BudgetWriteResult>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result.error) setError(result.error);
      else onClose();
    } catch {
      setError('Could not confirm the change was saved. Please reload to check before trying again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validAmount) { setError('Enter a valid planned amount.'); return; }
    if (!subcategory && !name.trim()) { setError('Enter a name for this subcategory.'); return; }
    void perform(() => subcategory ? onSave(value, excluded) : onAdd(name.trim(), value));
  };

  return (
    <Dialog title={title} description={confirmDelete ? `Remove ${subcategory?.name} from ${category}.` : 'Plan this month without changing recorded transactions.'} onClose={onClose} busy={busy} returnFocusRef={returnFocusRef} footer={
      confirmDelete ? <div className="flex flex-col gap-2">
        <button type="button" onClick={() => void perform(onDelete)} disabled={busy} className={`min-h-12 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 ${FOCUS}`}>{busy ? 'Deleting…' : 'Delete subcategory'}</button>
        <button ref={keepButtonRef} type="button" onClick={() => { setConfirmDelete(false); setError(null); }} disabled={busy} className={`min-h-11 rounded-xl px-4 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>Keep subcategory</button>
      </div> : <div className="flex flex-col gap-2">
        <button type="submit" form={formId} disabled={busy} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white hover:bg-green-uplift disabled:opacity-50 ${FOCUS}`}>{busy ? 'Saving…' : subcategory ? 'Save allocation' : category === 'Income' ? 'Add income source' : 'Add subcategory'}</button>
        <button type="button" onClick={onClose} disabled={busy} className={`min-h-11 rounded-xl px-4 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>Cancel</button>
      </div>
    }>
      {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
      {confirmDelete ? <p className="text-sm leading-relaxed text-black/70">Its planned amount will be removed. Historical transactions will remain in your activity and continue to follow the existing budget calculations.{subcategory?.excludeFromBudget && " Removing this excluded item also removes its exclusion, so its recorded activity will count toward budget totals."}</p> : (
        <form id={formId} onSubmit={handleSave}>
          <fieldset disabled={busy} className="min-w-0 space-y-5 disabled:opacity-60">
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: `${color}15` }}>
              <span style={{ color }}>
                <CategoryIcon category={category} className="h-6 w-6" />
              </span>
              <p className="min-w-0 break-words text-sm font-semibold text-black/87">{category}{subcategory ? ` / ${subcategory.name}` : ''}</p>
            </div>
            {!subcategory && <div>
              <label htmlFor={`${formId}-name`} className="mb-2 block text-sm font-medium text-black/87">{category === 'Income' ? 'Income source name' : 'Subcategory name'}</label>
              <input id={`${formId}-name`} value={name} onChange={event => setName(event.target.value)} required className={`${FIELD} text-base`} />
            </div>}
            <div>
              <label htmlFor={`${formId}-amount`} className="mb-2 block text-sm font-medium text-black/87">Planned amount</label>
              <input id={`${formId}-amount`} type="number" inputMode="decimal" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} aria-describedby={subcategory ? `${formId}-current` : undefined} className={`${FIELD} text-3xl font-semibold tabular-nums`} />
              {subcategory && <p id={`${formId}-current`} className="mt-2 text-xs text-black/60">Currently {formatCurrency(subcategory.expected)}</p>}
            </div>
            {subcategory && <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-2 text-sm text-black/87">
              <input type="checkbox" checked={!excluded} onChange={event => setExcluded(!event.target.checked)} className={`h-5 w-5 shrink-0 accent-house-green ${FOCUS}`} />
              <span>Include in budget totals<span className="mt-1 block text-xs leading-relaxed text-black/60">Excluded items still appear in activity and transaction history.</span>
              </span>
            </label>}
            {nextBalance !== null && <div aria-live="polite" className={`rounded-xl border p-4 ${nextStatus === 'overallocated' ? 'border-danger/30 bg-danger/5' : 'border-black/10 bg-green-mint/20'}`}>
              <p className={`break-words text-sm font-semibold ${nextStatus === 'overallocated' ? 'text-danger' : 'text-house-green'}`}>{nextStatus === 'allocated' ? 'Fully allocated' : nextStatus === 'overallocated' ? `Overallocated by ${formatCurrency(Math.abs(nextBalance))}` : `${formatCurrency(nextBalance)} left to allocate`}</p>
              <p className="mt-1 text-xs leading-relaxed text-black/60">{excluded ? 'This item is excluded from planning totals.' : 'Your planning balance after saving this change.'} {nextStatus === 'overallocated' && 'You can save and adjust another allocation.'}</p>
            </div>}
            {subcategory && <button ref={deleteButtonRef} type="button" onClick={() => { setConfirmDelete(true); setError(null); }} className={`min-h-11 rounded-lg px-1 text-sm font-semibold text-danger hover:bg-danger/5 ${FOCUS}`}>Delete subcategory</button>}
          </fieldset>
        </form>
      )}
      {busy && <p role="status" className="sr-only">Saving your change. Please wait.</p>}
    </Dialog>
  );
};
export default AllocationEditor;
