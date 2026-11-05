import React, { useId } from 'react';
import type { CategoryName, Subcategory } from '../types';
import { getCategoryColor } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { categoryActivity } from '../utils/budget-presentation';
import CategoryIcon from './CategoryIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PencilIcon from './icons/PencilIcon';
import PlusIcon from './icons/PlusIcon';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';

interface BudgetCategorySectionProps {
  category: CategoryName;
  expected: number;
  actual: number;
  subcategories: Subcategory[];
  actuals: Record<string, number>;
  view: 'track' | 'plan';
  expanded: boolean;
  onToggle: () => void;
  onEdit: (sub: Subcategory) => void;
  onAdd: () => void;
  headerRef: (element: HTMLButtonElement | null) => void;
}

const Activity: React.FC<{ category: CategoryName; name: string; expected: number; actual: number; compact?: boolean }> = ({ category, name, expected, actual, compact = false }) => {
  const { formatCurrency } = useSettings();
  const { percent, verb } = categoryActivity(category, expected, actual);
  return <span className={compact ? 'mt-1.5 block' : 'mt-2 block'}>
    <span className="block text-xs leading-relaxed text-black/60 sm:text-sm">{formatCurrency(actual)} of {formatCurrency(expected)} {verb}</span>
    <span className="mt-1.5 flex items-center gap-3">
      <span role={compact ? "progressbar" : undefined} aria-label={compact ? `${name} progress` : undefined} aria-valuemin={compact ? 0 : undefined} aria-valuemax={compact ? 100 : undefined} aria-valuenow={compact ? (percent === null ? 0 : Math.max(0, Math.min(100, percent))) : undefined} aria-valuetext={compact ? `${formatCurrency(actual)} ${verb}; ${formatCurrency(expected)} planned` : undefined} className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/10">
        <span className="block h-full rounded-full" style={{ width: `${percent === null ? 0 : Math.max(0, Math.min(100, percent))}%`, backgroundColor: getCategoryColor(category).hex }} />
      </span>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-black/60">{percent === null ? '—' : `${Math.round(percent)}%`}</span>
    </span>
  </span>;
};

const BudgetCategorySection: React.FC<BudgetCategorySectionProps> = ({ category, expected, actual, subcategories, actuals, view, expanded, onToggle, onEdit, onAdd, headerRef }) => {
  const { formatCurrency } = useSettings();
  const id = useId();
  const color = getCategoryColor(category).hex;
  const activity = categoryActivity(category, expected, actual);
  return (
    <section className="border-b border-black/10 last:border-b-0">
      <h3>
        <button ref={headerRef} type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={id} className={`flex min-h-16 w-full items-start gap-3 rounded-lg px-1 py-4 text-left hover:bg-black/5 sm:gap-4 ${FOCUS}`}>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color }}>
            <CategoryIcon category={category} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-base font-semibold text-black/87">{view === 'plan' && category === 'Income' ? 'Expected income' : category}</span>
              <span className="text-sm font-semibold tabular-nums text-house-green sm:text-base">{view === 'plan' ? formatCurrency(expected) : `${formatCurrency(activity.amount)} ${activity.label}`}</span>
            </span>
            {view === 'track' ? <Activity category={category} name={category} expected={expected} actual={actual} /> : <span className="mt-1 block text-xs font-normal text-black/60 sm:text-sm">{category === 'Income' ? 'Your planned income sources' : 'Planned total'}</span>}
          </span>
          <span aria-hidden="true" className="mt-2 shrink-0 text-black/60">
            <ChevronDownIcon className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </h3>
      <div id={id} hidden={!expanded} className="pb-4 pl-10 sm:pl-12">
        {subcategories.length === 0 && <p className="py-3 text-sm leading-relaxed text-black/60">{view === 'plan' ? 'Add a subcategory to start planning here.' : 'No subcategories yet. Add them in Plan.'}</p>}
        <ul className="divide-y divide-black/5">
          {subcategories.map(sub => {
            const row = categoryActivity(category, sub.expected, actuals[sub.name] || 0);
            return <li key={sub.id} className="py-3">
              {view === 'plan' ? (
                <button type="button" onClick={() => onEdit(sub)} aria-label={`Edit ${sub.name} in ${category}`} className={`flex min-h-11 w-full items-center gap-3 rounded-lg py-1 pl-1 pr-2 text-left hover:bg-black/5 ${FOCUS}`}>
                  <span className="min-w-0 flex-1 break-words text-sm font-medium text-black/87">{sub.name}{sub.excludeFromBudget && <span className="mt-1 block text-xs font-normal text-black/60">Excluded from totals</span>}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-black/87">{formatCurrency(sub.expected)}</span>
                  <span aria-hidden="true" className="shrink-0 text-black/60">
                    <PencilIcon className="h-4 w-4" />
                  </span>
                </button>
              ) : (
                <div className="px-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="min-w-0 break-words font-medium text-black/87">{sub.name}</span>
                    <span className={`font-medium tabular-nums ${row.delta > 0 ? 'text-green-accent' : row.delta < 0 ? 'text-danger' : 'text-black/60'}`}>{formatCurrency(row.amount)} {row.label}</span>
                  </div>
                  {sub.excludeFromBudget && <p className="mt-1 text-xs text-black/60">Excluded from totals · activity still shown</p>}
                  <Activity compact category={category} name={sub.name} expected={sub.expected} actual={actuals[sub.name] || 0} />
                </div>
              )}
            </li>;
          })}
        </ul>
        {view === 'plan' && <button type="button" onClick={onAdd} className={`mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-green-accent hover:bg-green-mint/30 ${FOCUS}`}>
          <span aria-hidden="true">
            <PlusIcon className="h-4 w-4" />
          </span>{category === 'Income' ? 'Add income source' : 'Add subcategory'}</button>}
      </div>
    </section>
  );
};
export default BudgetCategorySection;
