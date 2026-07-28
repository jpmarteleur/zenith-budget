
export const CATEGORY_NAMES = ['Income', 'Expenses', 'Bills', 'Savings', 'Investments', 'Debts'] as const;
export type CategoryName = typeof CATEGORY_NAMES[number];

export interface Transaction {
  id: string;
  date: string;
  category: CategoryName;
  subcategory: string;
  amount: number;
  note: string;
  // Set when the transaction was generated from a recurring rule. Field names here
  // must match the DB columns exactly — `updateTransaction` spreads the whole object
  // straight into a PostgREST update, so a camelCase name would fail at runtime.
  recurring_id?: string | null;
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

// A transaction that repeats on the same day every month — subscriptions, rent, salary.
// Offered as a checklist whenever a new month is created; never applied silently.
export interface RecurringRule {
  id: string;
  category: CategoryName;
  subcategory: string;
  amount: number;
  note: string;
  day_of_month: number; // 1-31, clamped down in months that are shorter
  active: boolean;
}

// One confirmed checklist row on its way into a month. `amount` may differ from the
// rule's — the checklist allows a one-off override without editing the rule itself.
export interface RecurringApplyItem {
  rule_id: string;
  category: CategoryName;
  subcategory: string;
  amount: number;
  note: string;
  day_of_month: number;
}