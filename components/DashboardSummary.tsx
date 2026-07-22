import React from 'react';
import type { CategoryName } from '../types';
import { CATEGORY_COLORS, CARD_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardSummaryProps {
  categoryName: CategoryName;
  expected: number;
  actual: number;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ categoryName, expected, actual }) => {
  const { formatCurrency } = useSettings();
  const { hex } = CATEGORY_COLORS[categoryName];
  const remaining = expected - actual;
  const progress = expected > 0 ? (actual / expected) * 100 : 0;

  return (
    <div className={`${CARD_STYLE} p-4`}>
      <h3 className="font-bold" style={{ color: hex }}>{categoryName}</h3>
      <div className="mt-2 text-sm text-black/60">
        <div className="flex justify-between">
          <span>Actual</span>
          <span className="font-medium text-black/80">{formatCurrency(actual)}</span>
        </div>
        <div className="flex justify-between">
          <span>Expected</span>
          <span className="font-medium text-black/80">{formatCurrency(expected)}</span>
        </div>
        <div className="flex justify-between mt-1 pt-1 border-t border-black/10">
          <span className="font-semibold">Remaining</span>
          <span className="font-semibold text-black/80">{formatCurrency(remaining)}</span>
        </div>
      </div>
      <div className="mt-4 h-2 w-full bg-ceramic rounded-full">
        <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: hex }}></div>
      </div>
    </div>
  );
};

export default DashboardSummary;
