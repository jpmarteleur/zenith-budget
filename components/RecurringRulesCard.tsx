import React, { useRef, useState } from 'react';
import type { RecurringRule, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import { getCategoryColor } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { ordinal } from '../utils/dates';
import type { useRecurring } from '../hooks/useRecurring';
import RecurringRuleModal from './RecurringRuleModal';
import Dialog from './Dialog';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
type RecurringRulesCardProps = Pick<ReturnType<typeof useRecurring>, 'rules' | 'addRule' | 'updateRule' | 'deleteRule' | 'toggleRuleActive' | 'isRecurringLoaded' | 'recurringLoadError' | 'retryRecurringLoad'> & { subcategories: Subcategories };
const RecurringRulesCard: React.FC<RecurringRulesCardProps> = ({ rules, addRule, updateRule, deleteRule, toggleRuleActive, subcategories, isRecurringLoaded, recurringLoadError, retryRecurringLoad }) => {
  const { formatCurrency } = useSettings();
  const [editing, setEditing] = useState<{ rule?: RecurringRule } | null>(null);
  const [deleting, setDeleting] = useState<RecurringRule | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);
  const change = async (rule: RecurringRule, remove: boolean) => {
    if (busyRef.current || uncertain) return;
    busyRef.current = true; setBusy(rule.id); setError(null);
    try {
      const result = await (remove ? deleteRule(rule.id) : toggleRuleActive(rule.id));
      if (result.error) { setError(result.error); setUncertain(!!result.uncertain); }
      else if (remove) setDeleting(null);
    } catch { setError('Could not confirm this change. Reload and check your rules before trying again.'); setUncertain(true); }
    finally { busyRef.current = false; setBusy(null); }
  };
  const errorMessage = error && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">
    <p>{error}</p>{uncertain && <button type="button" onClick={() => window.location.reload()} className={`mt-2 min-h-11 rounded-lg font-semibold underline ${FOCUS}`}>Reload rules</button>}
  </div>;
  return <section aria-labelledby="recurring-rules-title" className="rounded-2xl border border-black/10 bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4 sm:p-6">
      <div>
        <h2 id="recurring-rules-title" className="text-lg font-semibold tracking-tight text-house-green">Recurring transactions</h2>
        <p className="mt-1 text-sm text-black/60">Monthly income, bills, and other regular activity.</p>
      </div>
      <button ref={addRef} type="button" onClick={() => setEditing({})} disabled={!isRecurringLoaded || !!recurringLoadError || !!busy || uncertain} className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-house-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-uplift disabled:opacity-50 ${FOCUS}`}>
        <PlusIcon className="h-4 w-4" />
        <span>Add rule</span>
      </button>
    </header>
    <p className="px-4 pt-4 text-sm leading-relaxed text-black/60 sm:px-6">Active rules are offered during month setup. While the app is open, due rules are also added to an existing current-month budget. You can review missing entries from Budget. Planned allocations stay unchanged.</p>
    {!deleting && errorMessage && <div className="p-4 sm:px-6">{errorMessage}</div>}
    {!isRecurringLoaded ? <p role="status" className="p-6 text-sm text-black/60">Loading recurring rules…</p>
      : recurringLoadError ? <div role="alert" className="m-4 rounded-xl border border-danger/30 bg-danger/5 p-4 sm:m-6">
        <p className="text-sm leading-relaxed text-danger">{recurringLoadError}</p>
        <button type="button" onClick={retryRecurringLoad} className={`mt-2 min-h-11 rounded-lg text-sm font-semibold text-house-green underline ${FOCUS}`}>Try loading again</button>
      </div>
        : !rules.length ? <div className="px-5 py-8 text-center">
          <p className="text-sm font-medium">No recurring transactions yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-black/60">Add a rule for regular activity such as rent or payday. You can pause it at any time.</p>
        </div>
          : <div className="p-4 sm:p-6">{CATEGORY_NAMES.map(category => {
            const group = rules.filter(rule => rule.category === category);
            if (!group.length) return null;
            return <section key={category} aria-label={category} className="mb-5 last:mb-0">
              <h3 className="flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wide text-black/70">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getCategoryColor(category).hex }} aria-hidden="true" />{category}</h3>
              <ul className="divide-y divide-black/10">{group.map(rule => <li key={rule.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)] gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{rule.subcategory}</p>
                  <p className="mt-1 text-xs text-black/60">Monthly on the {ordinal(rule.day_of_month)}</p>{rule.note && <p className="mt-2 break-words text-sm leading-relaxed text-black/60">{rule.note}</p>}</div>
                <p className="min-w-0 break-all text-right text-sm font-semibold tabular-nums">{formatCurrency(rule.amount)}</p>
                <div className="col-span-2 flex flex-wrap items-center justify-end gap-1 sm:col-span-1">
                  <button type="button" aria-label={`${rule.active ? 'Pause' : 'Activate'} ${rule.subcategory}`} aria-pressed={rule.active} onClick={() => change(rule, false)} disabled={!!busy || uncertain} className={`min-h-11 rounded-xl px-3 text-xs font-semibold disabled:opacity-50 ${rule.active ? 'bg-green-mint text-house-green' : 'bg-black/5 text-black/70'} ${FOCUS}`}>{busy === rule.id && !deleting ? 'Saving…' : rule.active ? 'Active' : 'Paused'}</button>
                  <button type="button" aria-label={`Edit ${rule.subcategory} rule`} onClick={() => setEditing({ rule })} disabled={!!busy || uncertain} className={`flex h-11 w-11 items-center justify-center rounded-full text-black/60 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>
                    <span aria-hidden="true">
                      <PencilIcon className="h-4 w-4" />
                    </span>
                  </button>
                  <button type="button" aria-label={`Delete ${rule.subcategory} rule`} onClick={() => { setDeleting(rule); setError(null); }} disabled={!!busy || uncertain} className={`flex h-11 w-11 items-center justify-center rounded-full text-danger hover:bg-danger/5 disabled:opacity-50 ${FOCUS}`}>
                    <span aria-hidden="true">
                      <TrashIcon className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </li>)}</ul>
            </section>;
          })}</div>}
    {busy && !deleting && <p role="status" className="sr-only">Saving your recurring rule.</p>}
    {editing && <RecurringRuleModal rule={editing.rule} subcategories={subcategories} onClose={() => setEditing(null)} onSave={input => editing.rule ? updateRule({ ...input, id: editing.rule.id }) : addRule(input)} returnFocusRef={addRef} />}
    {deleting && <Dialog title="Delete recurring rule?" description="This stops the rule from generating future transactions. Transactions already recorded in your budgets are kept." onClose={() => setDeleting(null)} busy={!!busy} returnFocusRef={addRef} footer={
      <div className="flex flex-col gap-2">
        {!uncertain && <button type="button" onClick={() => change(deleting, true)} disabled={!!busy} className={`min-h-12 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS}`}>{busy ? 'Deleting…' : 'Delete rule'}</button>}
        <button type="button" onClick={() => setDeleting(null)} disabled={!!busy} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-50 ${FOCUS}`}>{uncertain ? 'Close' : 'Keep rule'}</button>
      </div>
    }>{errorMessage}<div className="mt-4 rounded-xl bg-black/5 p-4">
        <p className="break-words text-sm font-semibold">{deleting.subcategory}</p>
        <p className="mt-1 text-sm text-black/60">{deleting.category} · Monthly on the {ordinal(deleting.day_of_month)}</p>
        <p className="mt-3 text-xl font-semibold tabular-nums text-house-green">{formatCurrency(deleting.amount)}</p>{deleting.note && <p className="mt-2 break-words text-sm text-black/60">{deleting.note}</p>}</div>
    </Dialog>}
  </section>;
};
export default RecurringRulesCard;
