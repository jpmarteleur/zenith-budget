import React from 'react';
import type { CategoryName } from '../types';

const paths: Record<CategoryName, React.ReactNode> = {
  Income: <>
    <path d="M12 3v18m4-14H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7" />
  </>,
  Expenses: <>
    <path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18M16 3v18m0-10h4V3c-3 0-4 4-4 8Z" />
  </>,
  Bills: <>
    <path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7" />
  </>,
  Savings: <>
    <path d="M5 9a7 7 0 0 1 12-2l3-1v5l1 1v4l-3 1-1 4h-3l-1-3H9l-1 3H5l-1-5a6 6 0 0 1-1-4H1M9 7h4" />
    <circle cx="16" cy="10" r=".5" />
  </>,
  Investments: <>
    <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />
  </>,
  Debts: <>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3 10h18M7 15h4" />
  </>,
};

const CategoryIcon: React.FC<{ category: CategoryName; className?: string }> = ({ category, className = 'h-5 w-5' }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[category]}</svg>
);
export default CategoryIcon;
