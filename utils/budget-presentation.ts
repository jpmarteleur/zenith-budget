import type { CategoryName, Subcategory } from '../types';
import { GOAL_CATEGORIES } from '../constants';

// Match the previous summary's half-cent display tolerance; never round stored totals.
export const planStatus = (balance: number): 'allocated' | 'available' | 'overallocated' => {
  return Math.abs(balance) < 0.005 ? 'allocated' : balance > 0 ? 'available' : 'overallocated';
};

export const planningBalanceAfterEdit = (
  balance: number,
  category: CategoryName,
  current: Subcategory | undefined,
  expected: number,
  excluded: boolean,
): number => {
  const previous = current && !current.excludeFromBudget ? current.expected : 0;
  const next = excluded ? 0 : expected;
  return balance + (category === 'Income' ? 1 : -1) * (next - previous);
};

export const categoryActivity = (category: CategoryName, expected: number, actual: number) => {
  const goal = GOAL_CATEGORIES.includes(category);
  const remaining = expected - actual;
  const verb = category === 'Income' ? 'received' : category === 'Savings' ? 'saved' : category === 'Investments' ? 'invested' : 'used';
  return {
    amount: goal ? actual : Math.abs(remaining) < 0.005 ? 0 : Math.abs(remaining),
    label: goal ? verb : planStatus(remaining) === 'overallocated' ? 'over' : 'left',
    delta: goal ? Math.round(actual * 100) - Math.round(expected * 100) : Math.round(remaining * 100),
    verb,
    percent: expected > 0 ? (actual / expected) * 100 : null,
  };
};
