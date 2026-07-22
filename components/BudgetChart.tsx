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
            <div className="bg-white shadow-card p-3 border border-black/5 rounded-xl">
                <p className="font-bold text-black/87">{label}</p>
                <p style={{ color: '#9C8E76' }}>{`Expected: $${payload[0].value.toFixed(2)}`}</p>
                <p style={{ color: '#00754A' }}>{`Actual: $${payload[1].value.toFixed(2)}`}</p>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" stroke="rgba(0,0,0,0.35)" tick={{ fill: 'rgba(0,0,0,0.58)' }}/>
                <YAxis stroke="rgba(0,0,0,0.35)" tick={{ fill: 'rgba(0,0,0,0.58)' }}/>
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,98,65,0.06)'}}/>
                <Legend wrapperStyle={{color: 'rgba(0,0,0,0.58)'}} />
                <Bar dataKey="Expected" fill="#9C8E76" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="Actual" fill="#00754A" radius={[4, 4, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BudgetChart;