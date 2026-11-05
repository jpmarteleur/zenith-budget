import React, { useId, useMemo, useRef, useState } from 'react';
import type { RecurringRule, RecurringApplyItem, Subcategories } from '../types';
import type { RecurringWriteResult } from '../utils/recurring';
import { recurringItemsError } from '../utils/recurring';
import RecurringChecklist, { buildInitialChecklistState, checklistToItems, checklistError } from './RecurringChecklist';
import { useSettings } from '../contexts/SettingsContext';
import { getCategoryColor } from '../constants';
import { isDueOn, monthDayToDate } from '../utils/dates';
import Dialog from './Dialog';

interface ApplyRecurringModalProps {
  onClose: () => void;
  onManage: () => void;
  onApply: (items: RecurringApplyItem[]) => Promise<RecurringWriteResult>;
  rules: RecurringRule[];
  month: string;
  subcategories: Subcategories;
  appliedRuleIds: Set<string>;
}
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
const ApplyRecurringModal: React.FC<ApplyRecurringModalProps> = ({ onClose, onManage, onApply, rules, month, subcategories, appliedRuleIds }) => {
  const id = useId();
  const { formatCurrency } = useSettings();
  const [checklist, setChecklist] = useState(() => buildInitialChecklistState(rules));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const dueRules = useMemo(() => rules.filter(rule => isDueOn(month, rule.day_of_month)), [rules, month]);
  const upcomingRules = useMemo(() => rules
    .filter(rule => !appliedRuleIds.has(rule.id) && !isDueOn(month, rule.day_of_month))
    .sort((a, b) => a.day_of_month - b.day_of_month), [rules, month, appliedRuleIds]);
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
  return <Dialog title="Recurring this month" description={`${monthLabel}: review upcoming transactions and add any missing due entries. Amount overrides for due entries apply to this month only.`} busy={busy} onClose={onClose} footer={
    <div className="flex flex-col gap-2">
      {uncertain ? <button type="button" onClick={() => window.location.reload()} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white ${FOCUS}`}>Reload activity</button>
        : <button type="submit" form={id} disabled={busy || !items.length} className={`min-h-12 rounded-xl bg-house-green px-4 py-3 text-sm font-semibold text-white hover:bg-green-uplift disabled:opacity-50 ${FOCUS}`}>{busy ? 'Adding…' : `Add ${items.length} due transaction${items.length === 1 ? '' : 's'}`}</button>}
      <button type="button" onClick={onClose} disabled={busy} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>Close</button>
    </div>
  }>
    {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
    {upcomingRules.length > 0 && <section aria-labelledby={`${id}-upcoming`} className="mb-5">
      <h3 id={`${id}-upcoming`} className="text-base font-semibold text-house-green">Upcoming ({upcomingRules.length})</h3>
      <p className="mt-1 text-sm leading-relaxed text-black/60">These will be added automatically when their dates arrive while the app is open.</p>
      <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 px-3">
        {upcomingRules.map(rule => {
          const date = monthDayToDate(month, rule.day_of_month);
          const [year, number, day] = date.split('-').map(Number);
          return <li key={rule.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{rule.subcategory}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-black/60"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getCategoryColor(rule.category).hex }} />{rule.category}</p>
              <time dateTime={date} className="mt-1 block text-xs text-black/60">{new Date(year, number - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
              {rule.note && <p className="mt-1 break-words text-sm text-black/60">{rule.note}</p>}
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(rule.amount)}</p>
          </li>;
        })}
      </ul>
    </section>}
    <button type="button" onClick={onManage} disabled={busy || uncertain} className={`mb-5 min-h-11 w-full rounded-xl border border-house-green px-4 py-2 text-sm font-semibold text-house-green hover:bg-green-mint disabled:opacity-50 ${FOCUS}`}>Manage recurring rules</button>
    <h3 className="mb-2 text-base font-semibold text-house-green">Due entries</h3>
    <form id={id} onSubmit={apply}>
      <fieldset disabled={busy || uncertain} className="min-w-0 disabled:opacity-60">
        {dueRules.length ? <RecurringChecklist comfortable rules={dueRules} month={month} state={checklist} onStateChange={setChecklist} subcategories={subcategories} appliedRuleIds={appliedRuleIds} />
          : <p className="text-sm leading-relaxed text-black/60">No recurring transactions are due in this month yet.</p>}
      </fieldset>
    </form>
    <p className="mt-4 text-xs leading-relaxed text-black/60">Already added transactions cannot be selected. Managing a rule changes its future schedule; recorded transactions stay unchanged.</p>
    {busy && <p role="status" className="sr-only">Adding recurring transactions.</p>}
  </Dialog>;
};
export default ApplyRecurringModal;
