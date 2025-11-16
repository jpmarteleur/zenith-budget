import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryName } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface CategoryPieChartProps {
    actualAmounts: Record<CategoryName, number>;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/50 backdrop-blur-sm p-3 border border-cyan-400/30 rounded-lg">
                <p className="font-bold text-white font-display">{`${payload[0].name}: $${payload[0].value.toFixed(2)} (${(payload[0].percent * 100).toFixed(0)}%)`}</p>
            </div>
        );
    }
    return null;
};

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ actualAmounts }) => {
    const spendingCategories: CategoryName[] = ['Expenses', 'Bills', 'Debts', 'Savings'];

    const data = spendingCategories
        .map(cat => ({
            name: cat,
            value: actualAmounts[cat] || 0,
        }))
        .filter(item => item.value > 0);
    
    if (data.length === 0) {
        return <div className="flex items-center justify-center h-[300px] text-gray-500">No spending data to display.</div>
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
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as CategoryName].hex} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{color: '#d1d5db'}}/>
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CategoryPieChart;