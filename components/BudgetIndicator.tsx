import React from 'react';
import { CARD_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetIndicatorProps {
  title: string;
  amount: number;
}

const BudgetIndicator: React.FC<BudgetIndicatorProps> = ({ title, amount }) => {
    const { formatCurrency } = useSettings();
    const tolerance = 0.001; // Treat values within 0.001 as zero
    const amountColor = amount > tolerance ? 'text-green-accent' : amount < -tolerance ? 'text-danger' : 'text-black/87';

    return (
        <div className={`${CARD_STYLE} p-4 flex flex-col items-center justify-center text-center`}>
            <span className="text-sm font-medium text-black/50 uppercase tracking-wider">{title}</span>
            <span className={`text-3xl font-bold ${amountColor} mt-1`}>{formatCurrency(amount)}</span>
        </div>
    );
};

export default BudgetIndicator;
