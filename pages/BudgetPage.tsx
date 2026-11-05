import React, { useId, useMemo, useRef, useState } from 'react';
import type { useBudget } from '../hooks/useBudget';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import ApplyRecurringModal from '../components/ApplyRecurringModal';
import AllocationEditor from '../components/AllocationEditor';
import BudgetCategorySection from '../components/BudgetCategorySection';
import { CATEGORY_NAMES } from '../types';
import type { CategoryName, RecurringRule, Subcategory } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import CheckIcon from '../components/icons/CheckIcon';
import { isDueOn } from '../utils/dates';
import { planStatus } from '../utils/budget-presentation';
import { useSettings } from '../contexts/SettingsContext';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
type BudgetPageProps = ReturnType<typeof useBudget> & { selectedMonth: string; activeRecurringRules: RecurringRule[] };

const BudgetPage: React.FC<BudgetPageProps> = props => {
  const {
    remainingToBudget, remainingToSpend, expectedAmounts, actualAmounts, actualsBySubcategory,
    subcategories, addSubcategory, deleteSubcategory, saveSubcategoryPlan,
    transactions, addTransaction, updateTransaction, deleteTransaction, selectedMonth,
    activeRecurringRules, applyRecurringToMonth, isLoaded, loadError, retryLoad, availableMonths,
  } = props;
  const { formatCurrency } = useSettings();
  const id = useId();
  const [view, setView] = useState<'track' | 'plan'>('track');
  const [expanded, setExpanded] = useState<Set<CategoryName>>(() => new Set(['Expenses']));
  const [editor, setEditor] = useState<{ category: CategoryName; subcategory?: Subcategory } | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const transactionButtonRef = useRef<HTMLButtonElement | null>(null);
  const categoryHeaders = useRef<Partial<Record<CategoryName, HTMLButtonElement | null>>>({});
  const tabRefs = useRef<Partial<Record<'track' | 'plan', HTMLButtonElement | null>>>({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isApplyRecurringVisible, setIsApplyRecurringVisible] = useState(false);
  const appliedRuleIds = useMemo(() => new Set(transactions.map(t => t.recurring_id).filter(Boolean) as string[]), [transactions]);
  const pendingRules = useMemo(() => activeRecurringRules.filter(rule => !appliedRuleIds.has(rule.id) && isDueOn(selectedMonth, rule.day_of_month)), [activeRecurringRules, appliedRuleIds, selectedMonth]);
  const status = planStatus(remainingToBudget);
  const statusText = status === 'allocated' ? 'Fully allocated' : status === 'available' ? 'Left to allocate' : 'Overallocated';
  const openEditor = (category: CategoryName, subcategory?: Subcategory) => {
    returnFocusRef.current = categoryHeaders.current[category] || null;
    setEditor({ category, subcategory });
  };

  if (!isLoaded) return <div role="status" className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-sm text-black/60">Loading your budget…</div>;
  if (loadError) return <div role="alert" className="mx-auto max-w-4xl rounded-2xl border border-danger/30 bg-white p-6">
    <h2 className="text-lg font-semibold text-house-green">Your budget could not be loaded</h2>
    <p className="mt-2 text-sm text-black/70">{loadError}</p>
    <button type="button" onClick={retryLoad} className={`mt-4 min-h-11 rounded-xl bg-house-green px-5 text-sm font-semibold text-white ${FOCUS}`}>Try again</button>
  </div>;
  if (!availableMonths.includes(selectedMonth)) return <section className="mx-auto max-w-4xl rounded-2xl bg-white p-6">
    <h2 className="text-lg font-semibold text-house-green">No budget for this month</h2>
    <p className="mt-2 text-sm text-black/60">Use New month above to create your monthly plan.</p>
  </section>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div role="tablist" aria-label="Budget view" className="grid grid-cols-2 gap-1 rounded-xl bg-black/5 p-1">
        {(['track', 'plan'] as const).map(tab => <button key={tab} ref={element => { tabRefs.current[tab] = element; }} type="button" role="tab" id={`${id}-${tab}`} aria-selected={view === tab} aria-controls={`${id}-panel`} tabIndex={view === tab ? 0 : -1} onClick={() => setView(tab)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 'track' : event.key === 'End' ? 'plan' : tab === 'track' ? 'plan' : 'track';
          setView(next); tabRefs.current[next]?.focus();
        }} className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${FOCUS} ${view === tab ? 'bg-green-mint text-house-green' : 'text-black/60 hover:bg-white/60'}`}>{tab === 'track' ? 'Track' : 'Plan'}</button>)}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${view}`} className="rounded-2xl border border-black/10 bg-white px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 py-5 sm:py-6">
          <h2 className="text-xl font-semibold tracking-tight text-house-green">{view === 'track' ? 'This month' : 'Monthly plan'}</h2>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status === 'overallocated' ? 'bg-danger/5 text-danger' : 'bg-green-mint/50 text-house-green'}`}>{status === 'allocated' && <span aria-hidden="true">
              <CheckIcon className="h-4 w-4" />
            </span>}{statusText}</span>
            <p className="mt-1 text-sm font-medium tabular-nums text-black/70">{formatCurrency(status === 'allocated' ? 0 : Math.abs(remainingToBudget))}{status === 'available' ? ' to assign' : status === 'overallocated' ? ' over plan' : ' left to allocate'}</p>
          </div>
        </div>
        {CATEGORY_NAMES.map(category => (
          <BudgetCategorySection
            key={category}
            category={category}
            expected={expectedAmounts[category] || 0}
            actual={actualAmounts[category] || 0}
            subcategories={subcategories[category] || []}
            actuals={actualsBySubcategory[category] || {}}
            view={view}
            expanded={expanded.has(category)}
            headerRef={element => { categoryHeaders.current[category] = element; }}
            onToggle={() => setExpanded(current => {
              const next = new Set(current);
              if (next.has(category)) next.delete(category);
              else next.add(category);
              return next;
            })}
            onEdit={sub => openEditor(category, sub)}
            onAdd={() => openEditor(category)}
          />
        ))}
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-black/10 py-5">
          <div>
            <h3 className="text-sm font-medium text-black/87">{view === 'track' ? 'Recorded cash flow' : 'Planned totals'}</h3>
            <p className="mt-1 text-xs leading-relaxed text-black/60">{view === 'track' ? `Income ${formatCurrency(actualAmounts.Income || 0)} · Outflows ${formatCurrency((actualAmounts.Income || 0) - remainingToSpend)}` : `Income ${formatCurrency(expectedAmounts.Income)} · Allocated ${formatCurrency(expectedAmounts.Income - remainingToBudget)}`}</p>
          </div>
          {view === 'track' && <p className="text-lg font-semibold tabular-nums text-house-green">{formatCurrency(remainingToSpend)}</p>}
        </div>
      </div>
      {pendingRules.length > 0 && <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-black/70">{pendingRules.length === 1 ? "1 recurring transaction hasn't been added to this month yet." : `${pendingRules.length} recurring transactions haven't been added to this month yet.`}</p>
        <button type="button" onClick={() => setIsApplyRecurringVisible(true)} className={`min-h-11 shrink-0 rounded-xl border border-house-green px-4 py-2 text-sm font-semibold text-house-green hover:bg-green-mint ${FOCUS}`}>Apply recurring ({pendingRules.length})</button>
      </div>}
      <TransactionHistory addButtonRef={transactionButtonRef} selectedMonth={selectedMonth} transactions={transactions} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} subcategories={subcategories} onLogTransactionClick={() => setIsFormVisible(true)} />
      {!isFormVisible && <button type="button" onClick={() => setIsFormVisible(true)} aria-label="Log Transaction" className={`fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-accent text-white shadow-frap transition-colors hover:bg-sb-green md:bottom-8 md:right-8 ${FOCUS}`}>
        <PlusIcon className="h-6 w-6" />
      </button>}
      {isFormVisible && <TransactionForm returnFocusRef={transactionButtonRef} addTransaction={addTransaction} subcategories={subcategories} addSubcategory={addSubcategory} onClose={() => setIsFormVisible(false)} selectedMonth={selectedMonth} />}
      {isApplyRecurringVisible && <ApplyRecurringModal onClose={() => setIsApplyRecurringVisible(false)} onApply={items => applyRecurringToMonth(selectedMonth, items)} rules={activeRecurringRules} month={selectedMonth} subcategories={subcategories} appliedRuleIds={appliedRuleIds} />}
      {editor && (
        <AllocationEditor
          category={editor.category}
          subcategory={editor.subcategory}
          balance={remainingToBudget}
          returnFocusRef={returnFocusRef}
          onClose={() => setEditor(null)}
          onSave={(expected, excluded) => saveSubcategoryPlan(editor.category, editor.subcategory!.id, expected, excluded)}
          onAdd={(name, expected) => addSubcategory(editor.category, name, expected)}
          onDelete={() => deleteSubcategory(editor.category, editor.subcategory!.id)}
        />
      )}
    </div>
  );
};
export default BudgetPage;
