import React from 'react';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetIndicatorProps {
  title: string;
  amount: number;
}

const BudgetIndicator: React.FC<BudgetIndicatorProps> = ({ title, amount }) => {
    const { formatCurrency } = useSettings();
    const amountColor = amount > 0 ? 'text-emerald-400' : amount < 0 ? 'text-red-500' : 'text-gray-300';

    return (
        <div className={`${FUTURISTIC_GLASS_STYLE} p-4 flex flex-col items-center justify-center text-center`}>
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</span>
            <span className={`text-3xl font-bold font-display ${amountColor} mt-1`}>{formatCurrency(amount)}</span>
        </div>
    );
};

export default BudgetIndicator;
