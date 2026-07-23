import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryName } from '../types';
import { getCategoryColor } from '../constants';

interface CategoryPieChartProps {
    actualAmounts: Record<CategoryName, number>;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white shadow-card p-3 border border-black/5 rounded-xl">
                <p className="font-bold text-black/87">{`${payload[0].name}: $${payload[0].value.toFixed(2)} (${(payload[0].percent * 100).toFixed(0)}%)`}</p>
            </div>
        );
    }
    return null;
};

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ actualAmounts }) => {
    const spendingCategories: CategoryName[] = ['Expenses', 'Bills', 'Savings', 'Investments', 'Debts'];

    const data = spendingCategories
        .map(cat => ({
            name: cat,
            value: actualAmounts[cat] || 0,
        }))
        .filter(item => item.value > 0);
    
    if (data.length === 0) {
        return <div className="flex items-center justify-center h-[300px] text-black/40">No spending data to display.</div>
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={110}
                    fill="#00754A"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name).hex} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{color: 'rgba(0,0,0,0.58)'}}/>
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CategoryPieChart;