import type { CategoryName, Transaction } from '../types';
import { CATEGORY_NAMES } from '../types';
import { monthDayToDate, todayKey } from './dates';

export type TransactionInput = Pick<Transaction, 'date' | 'amount' | 'category' | 'subcategory' | 'note'>;
export interface TransactionDraft {
  date: string;
  amount: string;
  category: CategoryName;
  subcategory: string;
  note: string;
}

export const transactionMonthBounds = (month: string) => ({
  min: monthDayToDate(month, 1),
  max: monthDayToDate(month, 31),
});

export const initialTransactionDate = (month: string, today = todayKey()) => {
  const { min, max } = transactionMonthBounds(month);
  return today >= min && today <= max ? today : min;
};

export const transactionDraft = (month: string, transaction?: TransactionInput): TransactionDraft => ({
  date: transaction?.date ?? initialTransactionDate(month),
  amount: transaction ? String(transaction.amount) : '',
  category: transaction?.category ?? 'Expenses',
  subcategory: transaction?.subcategory ?? '',
  note: transaction?.note ?? '',
});

export const transactionInputError = (transaction: TransactionInput, month: string): string | null => {
  const { min, max } = transactionMonthBounds(month);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date) || transaction.date < min || transaction.date > max) {
    return 'Choose a valid date within this budget month.';
  }
  if (!Number.isFinite(transaction.amount)) return 'Enter a valid amount.';
  if (!(CATEGORY_NAMES as readonly string[]).includes(transaction.category)) return 'Choose a valid category.';
  if (typeof transaction.subcategory !== 'string' || !transaction.subcategory.trim()) return 'Choose or enter a subcategory.';
  if (typeof transaction.note !== 'string') return 'Enter a valid description.';
  return null;
};

export const draftInput = (draft: TransactionDraft): TransactionInput => ({ ...draft, amount: Number(draft.amount), subcategory: draft.subcategory.trim() });
export const transactionDraftError = (draft: TransactionDraft, month: string): string | null =>
  draft.amount.trim() === '' ? 'Enter an amount.' : transactionInputError(draftInput(draft), month);

// Only accept the agreed parser fields. Never forward extra AI output into a database write.
export const decodeParsedTransaction = (value: unknown): Omit<TransactionInput, 'date'> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount)
    || typeof data.category !== 'string' || !(CATEGORY_NAMES as readonly string[]).includes(data.category)
    || typeof data.subcategory !== 'string' || !data.subcategory.trim() || typeof data.note !== 'string') return null;
  return { amount: Math.abs(data.amount), category: data.category as CategoryName, subcategory: data.subcategory.trim(), note: data.note };
};
