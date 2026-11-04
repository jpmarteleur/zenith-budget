import React from 'react';
import type { RecurringRule, RecurringApplyItem, Subcategories } from '../types';
import { getCategoryColor } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { monthDayToDate } from '../utils/dates';

// Amounts are held as strings so a field can be transiently empty while the user
// retypes it, matching how CategoryCard edits its expected amounts.
export type ChecklistState = Record<string, { checked: boolean; amount: string }>;

export const buildInitialChecklistState = (rules: RecurringRule[]): ChecklistState =>
  Object.fromEntries(rules.map(r => [r.id, { checked: true, amount: String(r.amount) }]));

export const checklistToItems = (
  rules: RecurringRule[],
  state: ChecklistState,
  skipIds?: Set<string>
): RecurringApplyItem[] =>
  rules
    .filter(r => state[r.id]?.checked && !skipIds?.has(r.id))
    .map(r => ({
      rule_id: r.id,
      category: r.category,
      subcategory: r.subcategory,
      amount: parseFloat(state[r.id].amount) || 0,
      note: r.note,
      day_of_month: r.day_of_month,
    }));

interface RecurringChecklistProps {
  rules: RecurringRule[];          // already filtered to active
  month: string;                   // target month, drives the date preview
  state: ChecklistState;
  onStateChange: (next: ChecklistState) => void;
  subcategories?: Subcategories;   // target month's, to flag ones that don't exist yet
  appliedRuleIds?: Set<string>;    // already present in this month
  comfortable?: boolean;          // roomier controls for the month setup sheet
}

const RecurringChecklist: React.FC<RecurringChecklistProps> = ({
  rules, month, state, onStateChange, subcategories, appliedRuleIds, comfortable = false,
}) => {
  const { formatCurrency } = useSettings();

  if (rules.length === 0) {
    return (
      <p className="text-xs text-black/40">
        Set up recurring transactions in Settings and they'll be offered here automatically.
      </p>
    );
  }

  const selectable = rules.filter(r => !appliedRuleIds?.has(r.id));
  const allSelected = selectable.length > 0 && selectable.every(r => state[r.id]?.checked);

  const total = selectable.reduce(
    (sum, r) => state[r.id]?.checked ? sum + (parseFloat(state[r.id].amount) || 0) : sum,
    0
  );
  const selectedCount = selectable.filter(r => state[r.id]?.checked).length;

  const setRow = (id: string, patch: Partial<{ checked: boolean; amount: string }>) => {
    onStateChange({ ...state, [id]: { ...state[id], ...patch } });
  };

  const toggleAll = () => {
    const next = { ...state };
    selectable.forEach(r => { next[r.id] = { ...next[r.id], checked: !allSelected }; });
    onStateChange(next);
  };

  const isNewSubcategory = (rule: RecurringRule) =>
    subcategories !== undefined
    && !(subcategories[rule.category] || []).some(
      s => s.name.toLowerCase() === rule.subcategory.trim().toLowerCase()
    );

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <button
          type="button"
          onClick={toggleAll}
          className={`text-xs font-semibold text-green-accent hover:text-sb-green ${comfortable ? 'min-h-11 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-house-green' : ''}`}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
        <span className={`text-xs ${comfortable ? 'text-black/60' : 'text-black/50'}`}>
          {selectedCount} selected &middot; <span className="font-mono">{formatCurrency(total)}</span>
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-black/5 border border-black/10 rounded-lg px-3">
        {rules.map(rule => {
          const applied = appliedRuleIds?.has(rule.id) ?? false;
          const row = state[rule.id] ?? { checked: false, amount: String(rule.amount) };
          const color = getCategoryColor(rule.category).hex;

          return (
            <div
              key={rule.id}
              className={`flex items-center gap-2 py-2 ${applied ? 'opacity-50' : ''}`}
              title={applied ? 'Already added to this month' : undefined}
            >
              <label className={comfortable ? 'flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md' : 'flex shrink-0 items-center'}>
                <input
                  type="checkbox"
                  checked={applied ? false : row.checked}
                  disabled={applied}
                  onChange={e => setRow(rule.id, { checked: e.target.checked })}
                  className={`accent-green-accent w-4 h-4 flex-shrink-0 disabled:cursor-not-allowed ${comfortable ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green' : ''}`}
                  aria-label={`Include ${rule.subcategory}`}
                />
              </label>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-medium text-black/87 ${comfortable ? 'break-words' : 'truncate'}`}>{rule.subcategory}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${comfortable ? 'text-black/70' : ''}`}
                    style={{ backgroundColor: `${color}1A`, color: comfortable ? undefined : color }}
                  >
                    {rule.category}
                  </span>
                  {isNewSubcategory(rule) && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-mint text-sb-green flex-shrink-0">
                      new subcategory
                    </span>
                  )}
                </div>
                <div className={`text-xs ${comfortable ? 'break-words text-black/60' : 'text-black/40 truncate'}`}>
                  {monthDayToDate(month, rule.day_of_month)}
                  {rule.note ? ` · ${rule.note}` : ''}
                  {applied ? ' · already added' : ''}
                </div>
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                value={row.amount}
                disabled={applied}
                onChange={e => setRow(rule.id, { amount: e.target.value })}
                inputMode={comfortable ? 'decimal' : undefined}
                className={`${comfortable ? 'w-20 min-h-11 border-black/50 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green' : 'w-24 border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-green-accent/40'} flex-shrink-0 bg-white border rounded-lg py-1 px-2 text-black/87 text-right font-mono disabled:bg-black/5 disabled:cursor-not-allowed`}
                aria-label={`Amount for ${rule.subcategory}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecurringChecklist;
