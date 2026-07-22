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
import { CARD_STYLE } from '../constants';
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
    <div className={`${CARD_STYLE} p-4`}>
      <h3 className="text-lg font-bold text-black/87 mb-1">Flight Path</h3>
      <p className="text-xs text-black/60 mb-2">Daily Income vs. Spending for {selectedMonth}</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 35, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis
            dataKey="day"
            stroke="rgba(0,0,0,0.35)"
            tick={{ fontSize: 11 }}
            label={{ value: 'Day of Month', position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.58)', fontSize: 10 }}
          />
          <YAxis
            stroke="rgba(0,0,0,0.35)"
            tick={{ fontSize: 11 }}
            width={55}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: 'rgba(0,0,0,0.1)',
              borderRadius: 12,
              color: 'rgba(0,0,0,0.87)',
              fontSize: 11
            }}
            itemStyle={{ color: 'rgba(0,0,0,0.87)' }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingBottom: '15px' }}
            iconType="line"
            verticalAlign="top"
            align="center"
          />
          <Line
            type="monotone"
            dataKey="Income"
            stroke="#00754A"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Spending"
            stroke="#c82014"
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
