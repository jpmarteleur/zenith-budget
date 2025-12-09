import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryName } from '../types';

interface BudgetChartProps {
    expectedAmounts: Record<CategoryName, number>;
    actualAmounts: Record<CategoryName, number>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/50 backdrop-blur-sm p-3 border border-cyan-400/30 rounded-lg">
                <p className="font-bold text-white font-display">{label}</p>
                <p style={{ color: '#8884d8' }}>{`Expected: $${payload[0].value.toFixed(2)}`}</p>
                <p style={{ color: '#22d3ee' }}>{`Actual: $${payload[1].value.toFixed(2)}`}</p>
            </div>
        );
    }
    return null;
};

const BudgetChart: React.FC<BudgetChartProps> = ({ expectedAmounts, actualAmounts }) => {
    const spendingCategories: CategoryName[] = ['Expenses', 'Bills', 'Savings', 'Investments', 'Debts'];
    
    const data = spendingCategories.map(cat => ({
        name: cat,
        Expected: expectedAmounts[cat] || 0,
        Actual: actualAmounts[cat] || 0,
    }));
    
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.2)" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#d1d5db' }}/>
                <YAxis stroke="#9ca3af" tick={{ fill: '#d1d5db' }}/>
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34, 211, 238, 0.1)'}}/>
                <Legend wrapperStyle={{color: '#d1d5db'}} />
                <Bar dataKey="Expected" fill="#8884d8" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="Actual" fill="#22d3ee" radius={[4, 4, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BudgetChart;