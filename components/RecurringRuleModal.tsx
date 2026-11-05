import React, { useId, useRef, useState } from 'react';
import type { RecurringRule, CategoryName, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import type { RecurringRuleInput, RecurringWriteResult } from '../utils/recurring';
import { recurringInputError } from '../utils/recurring';
import Dialog from './Dialog';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
const FIELD = `min-h-12 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-base ${FOCUS}`;
interface RecurringRuleModalProps {
  onClose: () => void;
  onSave: (rule: RecurringRuleInput) => Promise<RecurringWriteResult>;
  rule?: RecurringRule;
  subcategories: Subcategories;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}

const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({ onClose, onSave, rule, subcategories, returnFocusRef }) => {
  const id = useId();
  const [category, setCategory] = useState<CategoryName>(rule?.category ?? 'Bills');
  const [subcategory, setSubcategory] = useState(rule?.subcategory ?? '');
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState(rule ? String(rule.amount) : '');
  const [day, setDay] = useState(rule ? String(rule.day_of_month) : '1');
  const [note, setNote] = useState(rule?.note ?? '');
  const [active, setActive] = useState(rule?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const options = subcategories[category] || [];
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current || uncertain) return;
    const input = { category, subcategory, amount: amount.trim() ? Number(amount) : NaN, day_of_month: day.trim() ? Number(day) : NaN, note, active };
    const validation = recurringInputError(input);
    if (validation) { setError(validation); return; }
    busyRef.current = true; setBusy(true); setError(null);
    try {
      const result = await onSave(input);
      if (result.error) { setError(result.error); setUncertain(!!result.uncertain); }
      else onClose();
    } catch { setError('Could not confirm this change. Reload and check your rules before trying again.'); setUncertain(true); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <Dialog title={rule ? 'Edit recurring transaction' : 'New recurring transaction'} description="Set the monthly details. Your planned allocations stay unchanged." onClose={onClose} busy={busy} returnFocusRef={returnFocusRef} footer={
    <div className="flex flex-col gap-2">
      {uncertain ? <button type="button" onClick={() => window.location.reload()} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white ${FOCUS}`}>Reload rules</button>
        : <button type="submit" form={id} disabled={busy} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white hover:bg-green-uplift disabled:opacity-50 ${FOCUS}`}>{busy ? 'Saving…' : rule ? 'Save changes' : 'Add rule'}</button>}
      <button type="button" onClick={onClose} disabled={busy} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>{uncertain ? 'Close' : 'Cancel'}</button>
    </div>
  }>
    {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
    <form id={id} onSubmit={submit}>
      <fieldset disabled={busy || uncertain} className="grid min-w-0 grid-cols-1 gap-5 disabled:opacity-60 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-category`} className="mb-2 block text-sm font-medium">Category</label>
          <select id={`${id}-category`} value={category} onChange={e => { setCategory(e.target.value as CategoryName); setSubcategory(''); setCreating(false); }} className={FIELD}>
            {CATEGORY_NAMES.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-subcategory`} className="mb-2 block text-sm font-medium">{creating ? 'New subcategory name' : 'Subcategory'}</label>
          {creating ? <div>
            <input autoFocus id={`${id}-subcategory`} value={subcategory} onChange={e => setSubcategory(e.target.value)} className={FIELD} required />
            <button type="button" onClick={() => { setCreating(false); setSubcategory(''); }} className={`mt-1 min-h-11 rounded-lg text-sm font-semibold text-green-accent ${FOCUS}`}>Choose existing</button>
          </div>
            : <select id={`${id}-subcategory`} value={subcategory} onChange={e => {
              if (e.target.selectedOptions[0].dataset.create) { setCreating(true); setSubcategory(''); }
              else setSubcategory(e.target.value);
            }} className={FIELD} required>
              <option value="" disabled>Select or create…</option>
              {subcategory && !options.some(option => option.name === subcategory) && <option value={subcategory}>{subcategory}</option>}
              {options.map(option => <option key={option.id} value={option.name}>{option.name}</option>)}
              <option data-create="true" value="__new_recurring_subcategory__">Create new subcategory…</option>
            </select>}
        </div>
        <div>
          <label htmlFor={`${id}-amount`} className="mb-2 block text-sm font-medium">Amount</label>
          <input id={`${id}-amount`} type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} className={FIELD} required />
        </div>
        <div>
          <label htmlFor={`${id}-day`} className="mb-2 block text-sm font-medium">Day of month</label>
          <input id={`${id}-day`} type="number" inputMode="numeric" min="1" max="31" step="1" value={day} onChange={e => setDay(e.target.value)} className={FIELD} required aria-describedby={`${id}-day-help`} />
          <p id={`${id}-day-help`} className="mt-2 text-xs leading-relaxed text-black/60">Shorter months use their last day.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-note`} className="mb-2 block text-sm font-medium">Note (optional)</label>
          <input id={`${id}-note`} value={note} onChange={e => setNote(e.target.value)} className={FIELD} />
        </div>
        <div className="sm:col-span-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-black/5 p-4">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className={`mt-1 h-4 w-4 accent-green-accent ${FOCUS}`} />
            <span>
              <span className="block text-sm font-semibold">Active</span>
              <span className="mt-1 block text-xs leading-relaxed text-black/60">Include in month setup and add when due while the app is open, if a current-month budget exists. Pausing keeps existing transactions.</span>
            </span>
          </label>
        </div>
        {creating && <p className="text-xs leading-relaxed text-black/60 sm:col-span-2">The subcategory is created with a planned amount of zero when this rule is applied.</p>}
      </fieldset>
    </form>
    {busy && <p role="status" className="sr-only">Saving your recurring rule.</p>}
  </Dialog>;
};
export default RecurringRuleModal;
