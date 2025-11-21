import React from 'react';
import type { CategoryName } from '../types';
import { CATEGORY_COLORS, FUTURISTIC_GLASS_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardSummaryProps {
  categoryName: CategoryName;
  expected: number;
  actual: number;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ categoryName, expected, actual }) => {
  const { formatCurrency } = useSettings();
  const { text, bg, base } = CATEGORY_COLORS[categoryName];
  const remaining = expected - actual;
  const progress = expected > 0 ? (actual / expected) * 100 : 0;

  return (
    <div className={`${FUTURISTIC_GLASS_STYLE} p-4`}>
      <h3 className={`font-bold ${text}`}>{categoryName}</h3>
      <div className="mt-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Actual</span>
          <span className="font-medium text-gray-200">{formatCurrency(actual)}</span>
        </div>
        <div className="flex justify-between">
          <span>Expected</span>
          <span className="font-medium text-gray-200">{formatCurrency(expected)}</span>
        </div>
        <div className="flex justify-between mt-1 pt-1 border-t border-white/10">
          <span className="font-semibold">Remaining</span>
          <span className="font-semibold text-gray-200">{formatCurrency(remaining)}</span>
        </div>
      </div>
      <div className="mt-4 h-2 w-full bg-gray-700/50 rounded-full">
        <div className={`h-full rounded-full bg-${base}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
    </div>
  );
};

export default DashboardSummary;