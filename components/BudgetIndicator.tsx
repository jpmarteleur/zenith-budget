import React from 'react';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetIndicatorProps {
  title: string;
  amount: number;
}

const BudgetIndicator: React.FC<BudgetIndicatorProps> = ({ title, amount }) => {
    const { formatCurrency } = useSettings();
    const tolerance = 0.001; // Treat values within 0.001 as zero
    const amountColor = amount > tolerance ? 'text-emerald-400' : amount < -tolerance ? 'text-red-500' : 'text-white';

    return (
        <div className={`${FUTURISTIC_GLASS_STYLE} p-4 flex flex-col items-center justify-center text-center`}>
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</span>
            <span className={`text-3xl font-bold font-display ${amountColor} mt-1`}>{formatCurrency(amount)}</span>
        </div>
    );
};

export default BudgetIndicator;
