import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import type { CategoryName } from '../types';

interface Transaction {
  id: string;
  date: string;
  category: CategoryName;
  subcategory: string;
  amount: number;
  note: string;
}

interface FlightPathChartProps {
  transactions: Transaction[];
  selectedMonth: string;
}

const FlightPathChart: React.FC<FlightPathChartProps> = ({ transactions, selectedMonth }) => {
  const chartData = useMemo(() => {
    // Group transactions by day
    const dailyData: Record<string, { income: number; spending: number }> = {};

    transactions.forEach(t => {
      const day = t.date.substring(8, 10); // Get DD part
      if (!dailyData[day]) {
        dailyData[day] = { income: 0, spending: 0 };
      }

      if (t.category === 'Income') {
        dailyData[day].income += t.amount;
      } else {
        dailyData[day].spending += t.amount;
      }
    });

    // Convert to array and sort by day
    return Object.keys(dailyData)
      .sort()
      .map(day => ({
        day: day,
        Income: Math.round(dailyData[day].income),
        Spending: Math.round(dailyData[day].spending),
      }));
  }, [transactions]);

  return (
    <div className={`${FUTURISTIC_GLASS_STYLE} p-4`}>
      <h3 className="text-lg font-bold text-white mb-1">Flight Path</h3>
      <p className="text-xs text-gray-400 mb-4">Daily Income vs. Spending for {selectedMonth}</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="day"
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
            label={{ value: 'Day of Month', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 10 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
            width={55}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              borderColor: '#374151',
              color: '#F3F4F6',
              fontSize: 11
            }}
            itemStyle={{ color: '#F3F4F6' }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: '10px' }}
            iconType="line"
            verticalAlign="bottom"
          />
          <Line
            type="monotone"
            dataKey="Income"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Spending"
            stroke="#EF4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FlightPathChart;
