
export const CATEGORY_NAMES = ['Income', 'Expenses', 'Bills', 'Savings', 'Debts'] as const;
export type CategoryName = typeof CATEGORY_NAMES[number];

export interface Transaction {
  id: string;
  date: string;
  category: CategoryName;
  subcategory: string;
  amount: number;
  note: string;
}

export interface Subcategory {
  id: string;
  name: string;
  expected: number;
  excludeFromBudget?: boolean;
}

export interface Category {
  name: CategoryName;
  expected: number;
  actual: number;
  subcategories: Subcategory[];
}

// These types are being phased out as budgeting moves to subcategories
// but are kept for potential future use or compatibility.
export interface BudgetItem {
  expected: number;
}
export type Budget = Record<CategoryName, BudgetItem>;
export type Subcategories = Record<CategoryName, Subcategory[]>;