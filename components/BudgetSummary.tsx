import React from 'react';
import type { CategoryName } from '../types';
import { CATEGORY_NAMES } from '../types';
import { CATEGORY_COLORS, CARD_STYLE } from '../constants';
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
  const { hex } = CATEGORY_COLORS[categoryName];
  // Guard against division by zero
  const progress = expected > 0 ? (actual / expected) * 100 : 0;

  return (
    <div className="py-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold" style={{ color: hex }}>{categoryName}</span>
        <div className="text-sm text-black/60">
          <span className="text-black/70 font-mono">{formatCurrency(actual)}</span>
          <span className="mx-1">/</span>
          <span>{formatCurrency(expected)}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-ceramic rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: hex }}></div>
      </div>
    </div>
  );
};


const BudgetSummary: React.FC<BudgetSummaryProps> = ({ expectedAmounts, actualAmounts }) => {
  return (
    <div className={`${CARD_STYLE} p-6`}>
      <h3 className="text-xl font-bold text-black/87 mb-2">Budget Summary</h3>
      <div className="divide-y divide-black/5 -my-3">
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
