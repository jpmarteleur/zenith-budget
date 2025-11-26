import React from 'react';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import type { CategoryName } from '../types';

interface VelocityGaugeProps {
  expectedAmounts: Record<CategoryName, number>;
  actualAmounts: Record<CategoryName, number>;
  selectedMonth: string;
}

const VelocityGauge: React.FC<VelocityGaugeProps> = ({ expectedAmounts, actualAmounts, selectedMonth }) => {
  // Calculate total expected spending (exclude Income)
  const totalExpectedSpending =
    expectedAmounts.Expenses +
    expectedAmounts.Bills +
    expectedAmounts.Debts +
    expectedAmounts.Savings;

  // Calculate total actual spending (exclude Income)
  const totalActualSpending =
    (actualAmounts.Expenses || 0) +
    (actualAmounts.Bills || 0) +
    (actualAmounts.Debts || 0) +
    (actualAmounts.Savings || 0);

  // Calculate month progress
  const now = new Date();
  const [year, month] = selectedMonth.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Only calculate progress if it's the current month
  const isCurrentMonth =
    now.getFullYear() === year &&
    now.getMonth() === month - 1;

  const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const monthProgress = currentDay / daysInMonth;

  // Calculate budget progress
  const budgetProgress = totalExpectedSpending > 0
    ? totalActualSpending / totalExpectedSpending
    : 0;

  // Velocity Index: > 1 means spending faster than time passing
  const velocityIndex = monthProgress > 0 ? budgetProgress / monthProgress : 0;
  const clampedVelocity = Math.min(Math.max(velocityIndex, 0), 2);

  // Convert 0-2 range to -90 to 90 degrees for gauge
  const rotation = (clampedVelocity * 90) - 90;

  // Determine status
  let statusColor = "text-cyan-400";
  let statusText = "Efficient";
  let gaugeColor = "#22d3ee";

  if (velocityIndex > 1.2) {
    statusColor = "text-red-500";
    statusText = "High Burn Rate";
    gaugeColor = "#ef4444";
  } else if (velocityIndex > 0.9) {
    statusColor = "text-yellow-400";
    statusText = "On Pace";
    gaugeColor = "#facc15";
  } else {
    statusColor = "text-green-400";
    statusText = "Under Budget";
    gaugeColor = "#10b981";
  }

  return (
    <div className={`${FUTURISTIC_GLASS_STYLE} p-4 flex flex-col items-center justify-center min-h-[380px]`}>
      <h3 className="text-lg font-bold text-white mb-1">Velocity Gauge</h3>
      <p className="text-xs text-gray-400 mb-4">Spending Burn Rate</p>

      <div className="relative w-56 h-28 mb-4">
        {/* Gauge Background Arc */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 200 100">
          {/* Background arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#374151"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Colored arc based on velocity */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${clampedVelocity * 125.6} 251.2`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>

        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-white origin-bottom transition-transform duration-1000 ease-out"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: 'bottom center'
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
        </div>

        {/* Center hub */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-gray-800 rounded-full border-2 border-white z-10"></div>
      </div>

      <div className={`text-3xl font-bold ${statusColor} mb-1`}>
        {velocityIndex.toFixed(2)}x
      </div>
      <div className="text-sm text-gray-400 uppercase tracking-wider mb-3">
        {statusText}
      </div>
      <div className="text-xs text-gray-500 text-center max-w-[200px]">
        Spent ${totalActualSpending.toLocaleString()} of ${totalExpectedSpending.toLocaleString()}
        ({Math.round(budgetProgress * 100)}% of budget)
      </div>
      <div className="text-xs text-gray-500 text-center">
        {Math.round(monthProgress * 100)}% through {isCurrentMonth ? 'current' : 'selected'} month
      </div>
    </div>
  );
};

export default VelocityGauge;
