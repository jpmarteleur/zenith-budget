import React, { useMemo, useRef, useState } from 'react';
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
import { planStatus } from '../utils/budget-presentation';
import { useSettings } from '../contexts/SettingsContext';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green';
type BudgetPageProps = ReturnType<typeof useBudget> & { selectedMonth: string; activeRecurringRules: RecurringRule[]; recurringReady: boolean; onManageRecurring: () => void };

const BudgetPage: React.FC<BudgetPageProps> = props => {
  const {
    remainingToBudget, remainingToSpend, expectedAmounts, actualAmounts, actualsBySubcategory,
    subcategories, addSubcategory, deleteSubcategory, saveSubcategoryPlan,
    transactions, addTransaction, updateTransaction, deleteTransaction, selectedMonth,
    activeRecurringRules, recurringReady, onManageRecurring, applyRecurringToMonth, isLoaded, loadError, retryLoad, availableMonths,
  } = props;
  const { formatCurrency } = useSettings();
  const [expanded, setExpanded] = useState<Set<CategoryName>>(() => new Set(['Expenses']));
  const [editor, setEditor] = useState<{ category: CategoryName; subcategory?: Subcategory } | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const transactionButtonRef = useRef<HTMLButtonElement | null>(null);
  const categoryHeaders = useRef<Partial<Record<CategoryName, HTMLButtonElement | null>>>({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isApplyRecurringVisible, setIsApplyRecurringVisible] = useState(false);
  const appliedRuleIds = useMemo(() => new Set(transactions.map(t => t.recurring_id).filter(Boolean) as string[]), [transactions]);
  const pendingRules = useMemo(() => activeRecurringRules.filter(rule => !appliedRuleIds.has(rule.id)), [activeRecurringRules, appliedRuleIds]);
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
    <p className="mt-2 text-sm text-black/60">Open the month dropdown and choose Create new month to start your monthly plan.</p>
  </section>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-24">
      <h1 className="sr-only">Monthly budget</h1>
      <section aria-labelledby="cash-flow-title" className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cash-flow-title" className="text-sm font-semibold text-house-green">Recorded cash flow</h2>
          <p className={`text-2xl font-semibold tabular-nums ${remainingToSpend < 0 ? 'text-danger' : 'text-house-green'}`}>{formatCurrency(remainingToSpend)}</p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-4 border-t border-black/10 pt-3 text-sm">
          <div><dt className="text-xs text-black/60">Income recorded</dt><dd className="mt-1 font-semibold tabular-nums">{formatCurrency(actualAmounts.Income || 0)}</dd></div>
          <div><dt className="text-xs text-black/60">Outflows recorded</dt><dd className="mt-1 font-semibold tabular-nums">{formatCurrency((actualAmounts.Income || 0) - remainingToSpend)}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-black/60">Recorded income minus outflows, not your bank balance.</p>
      </section>
      <section aria-label="Monthly categories" className="rounded-2xl border border-black/10 bg-white px-3 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 py-4 sm:py-5">
          <h2 className="text-xl font-semibold tracking-tight text-house-green">This month</h2>
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
      </section>
      <TransactionHistory pendingRecurringCount={recurringReady ? pendingRules.length : null} onReviewRecurring={() => setIsApplyRecurringVisible(true)} addButtonRef={transactionButtonRef} selectedMonth={selectedMonth} transactions={transactions} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} subcategories={subcategories} onLogTransactionClick={() => setIsFormVisible(true)} />
      {!isFormVisible && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white px-3 pt-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-4xl sm:px-3"><button type="button" onClick={() => setIsFormVisible(true)} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-house-green px-4 text-base font-semibold text-white hover:bg-green-uplift ${FOCUS}`}>
          <PlusIcon className="h-5 w-5" />Add transaction
        </button></div>
      </div>}
      {isFormVisible && <TransactionForm returnFocusRef={transactionButtonRef} addTransaction={addTransaction} subcategories={subcategories} addSubcategory={addSubcategory} onClose={() => setIsFormVisible(false)} selectedMonth={selectedMonth} />}
      {isApplyRecurringVisible && <ApplyRecurringModal onClose={() => setIsApplyRecurringVisible(false)} onApply={items => applyRecurringToMonth(selectedMonth, items)} rules={activeRecurringRules} onManage={onManageRecurring} month={selectedMonth} subcategories={subcategories} appliedRuleIds={appliedRuleIds} />}
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
