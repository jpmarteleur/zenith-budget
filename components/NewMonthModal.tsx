import React, { useId, useMemo, useRef, useState } from 'react';
import type { RecurringRule, RecurringApplyItem, Subcategories } from '../types';
import type { CreateMonthResult } from '../hooks/useBudget';
import { isDueOn, resolveSourceMonth } from '../utils/dates';
import Dialog from './Dialog';
import RecurringChecklist, { buildInitialChecklistState, checklistToItems, checklistError } from './RecurringChecklist';
import type { ChecklistState } from './RecurringChecklist';

const EMPTY_SUBCATEGORIES: Subcategories = {
  Income: [], Expenses: [], Bills: [], Savings: [], Investments: [], Debts: [],
};
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
const FIELD = `min-h-11 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-2 text-base text-black/87 ${FOCUS}`;
const OPTIONS = [
  { value: 'copy', title: 'Copy a month', description: 'Keep subcategories and their planned amounts.' },
  { value: 'blank', title: 'Keep categories, reset amounts', description: 'Keep subcategories with all planned amounts set to zero.' },
  { value: 'scratch', title: 'Start from scratch', description: 'Begin with no subcategories or planned amounts.' },
] as const;

interface NewMonthModalProps {
  onClose: () => void;
  onCreate: (month: string, option: 'copy' | 'blank' | 'scratch', sourceMonth?: string, recurringToApply?: RecurringApplyItem[]) => Promise<CreateMonthResult>;
  onCreated: (month: string) => void;
  month: string;
  availableMonths: string[];
  activeRecurringRules: RecurringRule[];
  subcategoriesByMonth: Record<string, Subcategories>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

const previousMonth = (month: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return '';
  const [year, number] = month.split('-').map(Number);
  const date = new Date(year, number - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  return new Date(year, number - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const NewMonthModal: React.FC<NewMonthModalProps> = ({
  onClose, onCreate, onCreated, month, availableMonths, activeRecurringRules,
  subcategoriesByMonth, returnFocusRef,
}) => {
  const formId = useId();
  const monthId = useId();
  const sourceId = useId();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [creationOption, setCreationOption] = useState<'copy' | 'blank' | 'scratch'>('copy');
  const [sourceMonth, setSourceMonth] = useState(previousMonth(month));
  const [checklist, setChecklist] = useState<ChecklistState>(() => buildInitialChecklistState(activeRecurringRules));
  const [isCreating, setIsCreating] = useState(false);
  const creatingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [monthCreated, setMonthCreated] = useState(false);
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth);
  const monthAlreadyExists = availableMonths.includes(selectedMonth);
  const duplicate = monthAlreadyExists && !isCreating && !monthCreated;
  const dueRules = useMemo(
    () => validMonth ? activeRecurringRules.filter(rule => isDueOn(selectedMonth, rule.day_of_month)) : [],
    [activeRecurringRules, selectedMonth, validMonth],
  );
  const resolvedSource = validMonth ? resolveSourceMonth(availableMonths, selectedMonth, creationOption === 'copy' ? sourceMonth : undefined) : undefined;
  const targetSubcategories = creationOption === 'scratch' ? EMPTY_SUBCATEGORIES : (resolvedSource && subcategoriesByMonth[resolvedSource]) || EMPTY_SUBCATEGORIES;
  const sourceOptions = [...new Set([previousMonth(selectedMonth), ...availableMonths])].filter(Boolean);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validMonth || monthAlreadyExists || creatingRef.current || monthCreated) return;
    const validation = checklistError(dueRules, checklist);
    if (validation) { setError(validation); return; }
    creatingRef.current = true;
    setIsCreating(true);
    setError(null);
    try {
      const result = await onCreate(selectedMonth, creationOption, creationOption === 'copy' ? sourceMonth : undefined, checklistToItems(dueRules, checklist));
      if (result.error) {
        setError(result.error);
        setMonthCreated(result.created);
      } else if (result.created) {
        onCreated(selectedMonth);
      }
    } catch {
      setError('Could not confirm whether this month was saved. Reload to check its status before trying again.');
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      title="New budget month"
      description="Choose a starting point for your monthly plan."
      onClose={onClose}
      busy={isCreating}
      returnFocusRef={returnFocusRef}
      footer={
        <div className="flex flex-col gap-2">
          <button type={monthCreated ? 'button' : 'submit'} form={monthCreated ? undefined : formId} onClick={monthCreated ? () => onCreated(selectedMonth) : undefined} disabled={isCreating || (!monthCreated && (duplicate || !validMonth))} className={`min-h-12 rounded-xl bg-house-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-uplift disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}>
            {isCreating ? 'Creating month…' : monthCreated ? 'Open created month' : 'Create month'}
          </button>
          <button type="button" onClick={onClose} disabled={isCreating} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-40 ${FOCUS}`}>{monthCreated ? 'Close' : 'Cancel'}</button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleCreate}>
        {error && <div role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{monthCreated && <p className="mb-1 font-semibold">Your month was created.</p>}{error}</div>}
        <fieldset disabled={isCreating || monthCreated} className="min-w-0 space-y-6 disabled:opacity-60">
          <div>
            <label htmlFor={monthId} className="mb-2 block text-sm font-semibold text-black/87">Budget month</label>
            <input id={monthId} type="month" required value={selectedMonth} onChange={event => { setSelectedMonth(event.target.value); setSourceMonth(previousMonth(event.target.value)); setError(null); }} aria-invalid={duplicate || undefined} aria-describedby={`${monthId}-hint${duplicate ? ` ${monthId}-error` : ''}`} className={FIELD} />
            <p id={`${monthId}-hint`} className="mt-2 text-xs leading-relaxed text-black/60">Choose a past, current, or future month.</p>
            {duplicate && <p id={`${monthId}-error`} role="alert" className="mt-2 text-sm text-danger">A budget already exists for this month. Choose another month.</p>}
          </div>
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold text-black/87">Start your plan</legend>
            <div className="space-y-2">
              {OPTIONS.map(option => (
                <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${creationOption === option.value ? 'border-house-green bg-green-mint/30' : 'border-black/20 bg-white hover:border-black/40'}`}>
                  <input type="radio" name={`${formId}-starting-point`} value={option.value} checked={creationOption === option.value} onChange={() => setCreationOption(option.value)} className={`mt-0.5 h-5 w-5 shrink-0 accent-house-green ${FOCUS}`} />
                  <span className="min-w-0"><span className="block text-sm font-semibold text-black/87">{option.title}</span><span className="mt-1 block text-sm leading-relaxed text-black/60">{option.description}</span></span>
                </label>
              ))}
            </div>
            {creationOption === 'copy' && (
              <div className="mt-4">
                <label htmlFor={sourceId} className="mb-2 block text-sm font-medium text-black/70">Copy from</label>
                <select id={sourceId} value={sourceMonth} onChange={event => setSourceMonth(event.target.value)} className={FIELD} disabled={!validMonth}>
                  {sourceOptions.map(source => <option key={source} value={source}>{formatMonth(source)}{source === previousMonth(selectedMonth) ? ' (previous month)' : ''}</option>)}
                </select>
              </div>
            )}
            {creationOption !== 'scratch' && validMonth && <p className="mt-3 text-xs leading-relaxed text-black/60">{resolvedSource ? `Subcategories come from ${formatMonth(resolvedSource)}${creationOption === 'blank' ? ', with planned amounts reset to zero' : ''}.` : 'No source budget is available. This month will start with no subcategories.'} Existing transactions stay in their original month.</p>}
          </fieldset>
          {activeRecurringRules.length > 0 && (
            <section aria-labelledby={`${formId}-recurring`} className="border-t border-black/10 pt-5">
              <h3 id={`${formId}-recurring`} className="text-sm font-semibold text-black/87">Recurring transactions</h3>
              {dueRules.length === 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-black/60">{validMonth ? 'None are due yet in this month. They will be added automatically as their dates arrive.' : 'Choose a month to see which transactions are due.'}</p>
              ) : (
                <>
                  <p className="mb-3 mt-2 text-sm leading-relaxed text-black/60">These are already due. Choose which to include and adjust amounts for this month. Later transactions arrive on their own day.</p>
                  <RecurringChecklist comfortable rules={dueRules} month={selectedMonth} state={checklist} onStateChange={setChecklist} subcategories={targetSubcategories} />
                </>
              )}
            </section>
          )}
        </fieldset>
        {isCreating && <p role="status" className="sr-only">Saving your budget month. Please wait.</p>}
      </form>
    </Dialog>
  );
};

export default NewMonthModal;
