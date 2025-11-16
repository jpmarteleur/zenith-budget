import React from 'react';
import type { useBudget } from '../hooks/useBudget';
import BudgetIndicator from '../components/BudgetIndicator';
import DashboardSummary from '../components/DashboardSummary';
import { CATEGORY_NAMES } from '../types';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import BudgetChart from '../components/BudgetChart';
import CategoryPieChart from '../components/CategoryPieChart';

type DashboardPageProps = ReturnType<typeof useBudget>;

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const {
    remainingToBudget,
    remainingToSpend,
    expectedAmounts,
    actualAmounts,
  } = props;

  const spendingCategories = CATEGORY_NAMES.filter(c => c !== 'Income');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetIndicator title="Remaining to Budget" amount={remainingToBudget} />
        <BudgetIndicator title="Remaining to Spend" amount={remainingToSpend} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {spendingCategories.map(cat => (
          <DashboardSummary 
            key={cat}
            categoryName={cat}
            expected={expectedAmounts[cat] || 0}
            actual={actualAmounts[cat] || 0}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={FUTURISTIC_GLASS_STYLE + " p-6"}>
          <h3 className="text-xl font-bold text-white mb-4">Budget vs. Actual Spending</h3>
          <BudgetChart expectedAmounts={expectedAmounts} actualAmounts={actualAmounts} />
        </div>
        <div className={FUTURISTIC_GLASS_STYLE + " p-6"}>
          <h3 className="text-xl font-bold text-white mb-4">Spending Category Breakdown</h3>
          <CategoryPieChart actualAmounts={actualAmounts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;