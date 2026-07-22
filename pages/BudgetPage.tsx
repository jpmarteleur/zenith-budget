import React, { useState } from 'react';
import type { useBudget } from '../hooks/useBudget';
import BudgetIndicator from '../components/BudgetIndicator';
import CategoryCard from '../components/CategoryCard';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';
import { CATEGORY_NAMES } from '../types';
import { CARD_STYLE, BTN_PRIMARY } from '../constants';
import BudgetSummary from '../components/BudgetSummary';
import PlusIcon from '../components/icons/PlusIcon';

type BudgetPageProps = ReturnType<typeof useBudget> & { selectedMonth: string };

const BudgetPage: React.FC<BudgetPageProps> = (props) => {
  const {
    remainingToBudget,
    remainingToSpend,
    expectedAmounts,
    actualAmounts,
    actualsBySubcategory,
    subcategories,
    addSubcategory,
    deleteSubcategory,
    updateSubcategoryExpected,
    toggleSubcategoryExcludeFromBudget,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    selectedMonth,
  } = props;

  const [isFormVisible, setIsFormVisible] = useState(false);

  return (
    <div className="space-y-6">
      {/* Floating Action Button */}
      {!isFormVisible && (
        <button
          type="button"
          onClick={() => setIsFormVisible(true)}
          aria-label="Log Transaction"
          className="fixed bottom-6 right-4 md:bottom-8 md:right-8 bg-green-accent hover:bg-sb-green text-white w-14 h-14 rounded-full flex items-center justify-center shadow-frap transition-all duration-200 active:scale-95 z-50"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetIndicator title="Remaining to Budget" amount={remainingToBudget} />
        <BudgetIndicator title="Remaining to Spend" amount={remainingToSpend} />
      </div>

      <BudgetSummary expectedAmounts={expectedAmounts} actualAmounts={actualAmounts} />

      {transactions.length === 0 && (
        <div className={`${CARD_STYLE} p-6 text-center`}>
          <h4 className="text-lg font-semibold text-black/87">Your budget is ready!</h4>
          <p className="text-black/60 mt-1 mb-4">The next step is to log your income and expenses.</p>
          <button
            onClick={() => setIsFormVisible(true)}
            className={`${BTN_PRIMARY} space-x-2 mx-auto`}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Log Your First Transaction</span>
          </button>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-black/87 mb-4">Detailed Budget</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_NAMES.map((catName) => (
            <CategoryCard
              key={catName}
              categoryName={catName}
              expected={expectedAmounts[catName] || 0}
              actual={actualAmounts[catName] || 0}
              subcategories={subcategories[catName] || []}
              actualsBySubcategory={actualsBySubcategory[catName] || {}}
              onAddSubcategory={addSubcategory}
              onDeleteSubcategory={deleteSubcategory}
              onUpdateSubcategoryExpected={updateSubcategoryExpected}
              onToggleExcludeFromBudget={toggleSubcategoryExcludeFromBudget}
            />
          ))}
        </div>
      </div>
      
      <TransactionTable 
        transactions={transactions} 
        updateTransaction={updateTransaction}
        deleteTransaction={deleteTransaction}
        subcategories={subcategories}
        onLogTransactionClick={() => setIsFormVisible(true)}
      />
      
      {isFormVisible && (
          <TransactionForm 
            addTransaction={addTransaction} 
            subcategories={subcategories}
            addSubcategory={addSubcategory}
            onClose={() => setIsFormVisible(false)}
            selectedMonth={selectedMonth}
          />
      )}

    </div>
  );
};

export default BudgetPage;