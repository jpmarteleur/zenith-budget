import React from 'react';
import { CARD_STYLE } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetIndicatorProps {
  title: string;
  amount: number;
}

const BudgetIndicator: React.FC<BudgetIndicatorProps> = ({ title, amount }) => {
    const { formatCurrency } = useSettings();
    // Normalize near-zero values locally as a defensive measure in case some
    // callers pass through tiny negative values or -0 that slip past formatting.
    const displayAmount = Math.abs(typeof amount === 'number' ? amount : Number(amount)) < 0.005 ? 0 : amount;
    const tolerance = 0.001; // Treat values within 0.001 as zero for coloring
    const amountColor = displayAmount > tolerance ? 'text-green-accent' : displayAmount < -tolerance ? 'text-danger' : 'text-black/87';

    return (
        <div className={`${CARD_STYLE} p-4 flex flex-col items-center justify-center text-center`}>
            <span className="text-sm font-medium text-black/50 uppercase tracking-wider">{title}</span>
            <span className={`text-3xl font-bold ${amountColor} mt-1`}>{formatCurrency(displayAmount as number)}</span>
        </div>
    );
};

export default BudgetIndicator;
