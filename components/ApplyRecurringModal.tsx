import React, { useId, useMemo, useRef, useState } from 'react';
import type { RecurringRule, RecurringApplyItem, Subcategories } from '../types';
import type { RecurringWriteResult } from '../utils/recurring';
import { recurringItemsError } from '../utils/recurring';
import RecurringChecklist, { buildInitialChecklistState, checklistToItems, checklistError } from './RecurringChecklist';
import { isDueOn } from '../utils/dates';
import Dialog from './Dialog';

interface ApplyRecurringModalProps {
  onClose: () => void;
  onApply: (items: RecurringApplyItem[]) => Promise<RecurringWriteResult>;
  rules: RecurringRule[];
  month: string;
  subcategories: Subcategories;
  appliedRuleIds: Set<string>;
}
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
const ApplyRecurringModal: React.FC<ApplyRecurringModalProps> = ({ onClose, onApply, rules, month, subcategories, appliedRuleIds }) => {
  const id = useId();
  const [checklist, setChecklist] = useState(() => buildInitialChecklistState(rules));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const dueRules = useMemo(() => rules.filter(rule => isDueOn(month, rule.day_of_month)), [rules, month]);
  const items = checklistToItems(dueRules, checklist, appliedRuleIds);
  const [year, number] = month.split('-').map(Number);
  const monthLabel = new Date(year, number - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current || uncertain || !items.length) return;
    const validation = checklistError(dueRules, checklist, appliedRuleIds) || recurringItemsError(items);
    if (validation) { setError(validation); return; }
    busyRef.current = true; setBusy(true); setError(null);
    try {
      const result = await onApply(items);
      if (result.error) { setError(result.error); setUncertain(!!result.uncertain); }
      else onClose();
    } catch { setError('Could not confirm these transactions. Reload and check history before trying again.'); setUncertain(true); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <Dialog title="Apply recurring transactions" description={`Add due transactions to ${monthLabel}. Overrides apply to this month only.`} busy={busy} onClose={onClose} footer={
    <div className="flex flex-col gap-2">
      {uncertain ? <button type="button" onClick={() => window.location.reload()} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white ${FOCUS}`}>Reload activity</button>
        : <button type="submit" form={id} disabled={busy || !items.length} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white hover:bg-green-uplift disabled:opacity-50 ${FOCUS}`}>{busy ? 'Adding…' : `Add ${items.length} transaction${items.length === 1 ? '' : 's'}`}</button>}
      <button type="button" onClick={onClose} disabled={busy} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>{uncertain ? 'Close' : 'Cancel'}</button>
    </div>
  }>
    {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
    <form id={id} onSubmit={apply}>
      <fieldset disabled={busy || uncertain} className="min-w-0 disabled:opacity-60">
        {dueRules.length ? <RecurringChecklist comfortable rules={dueRules} month={month} state={checklist} onStateChange={setChecklist} subcategories={subcategories} appliedRuleIds={appliedRuleIds} />
          : <p className="text-sm leading-relaxed text-black/60">No recurring transactions are due in this month yet.</p>}
      </fieldset>
    </form>
    <p className="mt-4 text-xs leading-relaxed text-black/60">Already added transactions cannot be selected. Later dates become due as the month progresses.</p>
    {busy && <p role="status" className="sr-only">Adding recurring transactions.</p>}
  </Dialog>;
};
export default ApplyRecurringModal;
