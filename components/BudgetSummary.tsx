import React from 'react';
import type { CategoryName } from '../types';
import { CATEGORY_NAMES } from '../types';
import { CATEGORY_COLORS, FUTURISTIC_GLASS_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetSummaryProps {
  expectedAmounts: Record<CategoryName, number>;
  actualAmounts: Record<CategoryName, number>;
}

const SummaryRow: React.FC<{
  categoryName: CategoryName;
  expected: number;
  actual: number;
}> = ({ categoryName, expected, actual }) => {
  const { formatCurrency } = useSettings();
  const { text, base } = CATEGORY_COLORS[categoryName];
  // Guard against division by zero
  const progress = expected > 0 ? (actual / expected) * 100 : 0;

  return (
    <div className="py-3">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-semibold ${text}`}>{categoryName}</span>
        <div className="text-sm text-gray-400">
          <span className="text-gray-300 font-mono">{formatCurrency(actual)}</span>
          <span className="mx-1">/</span>
          <span>{formatCurrency(expected)}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-${base}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
    </div>
  );
};


const BudgetSummary: React.FC<BudgetSummaryProps> = ({ expectedAmounts, actualAmounts }) => {
  return (
    <div className={`${FUTURISTIC_GLASS_STYLE} p-6`}>
      <h3 className="text-xl font-bold text-white mb-2">Budget Summary</h3>
      <div className="divide-y divide-cyan-400/10 -my-3">
        {CATEGORY_NAMES.map(catName => (
          <SummaryRow 
            key={catName}
            categoryName={catName}
            expected={expectedAmounts[catName] || 0}
            actual={actualAmounts[catName] || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default BudgetSummary;