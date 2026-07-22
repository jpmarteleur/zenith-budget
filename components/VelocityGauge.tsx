import React from 'react';
import { CARD_STYLE } from '../constants';
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
  let statusColor = "text-green-accent";
  let statusText = "Efficient";
  let gaugeColor = "#00754A";

  if (velocityIndex > 1.2) {
    statusColor = "text-danger";
    statusText = "High Burn Rate";
    gaugeColor = "#c82014";
  } else if (velocityIndex > 0.9) {
    statusColor = "text-[#C08A2D]";
    statusText = "On Pace";
    gaugeColor = "#C08A2D";
  } else {
    statusColor = "text-green-accent";
    statusText = "Under Budget";
    gaugeColor = "#00754A";
  }

  return (
    <div className={`${CARD_STYLE} p-4 flex flex-col items-center justify-center min-h-[380px]`}>
      <h3 className="text-lg font-bold text-black/87 mb-1">Velocity Gauge</h3>
      <p className="text-xs text-black/60 mb-4">Spending Burn Rate</p>

      <div className="relative w-56 h-28 mb-4">
        {/* Gauge Background Arc */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 200 100">
          {/* Background arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#e0ddd5"
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
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-house-green origin-bottom transition-transform duration-1000 ease-out"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: 'bottom center'
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-house-green rounded-full shadow-lg"></div>
        </div>

        {/* Center hub */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-house-green rounded-full border-2 border-cream z-10"></div>
      </div>

      <div className={`text-3xl font-bold ${statusColor} mb-1`}>
        {velocityIndex.toFixed(2)}x
      </div>
      <div className={`text-sm font-semibold ${statusColor} uppercase tracking-wider mb-4`}>
        {statusText}
      </div>

      {/* Budget Progress */}
      <div className="w-full max-w-[240px] space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-black/60">Budget Used:</span>
          <span className="text-black/80 font-semibold">{Math.round(budgetProgress * 100)}%</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-black/60">Spent:</span>
          <span className="text-black/80 font-semibold">${totalActualSpending.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-black/60">Budget:</span>
          <span className="text-black/80 font-semibold">${totalExpectedSpending.toLocaleString()}</span>
        </div>

        <div className="border-t border-black/10 my-2"></div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-black/60">Month Progress:</span>
          <span className="text-black/80 font-semibold">{Math.round(monthProgress * 100)}%</span>
        </div>
        <div className="text-xs text-black/40 text-center mt-1">
          Day {currentDay} of {daysInMonth} {isCurrentMonth ? '(current)' : ''}
        </div>
      </div>
    </div>
  );
};

export default VelocityGauge;
