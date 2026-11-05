import { CATEGORY_NAMES } from '../types';
import type { RecurringRule, RecurringApplyItem } from '../types';

export type RecurringRuleInput = Omit<RecurringRule, 'id'>;
export interface RecurringWriteResult {
  error: string | null;
  uncertain?: boolean;
}

export const recurringInputError = (input: RecurringRuleInput): string | null => {
  if (!CATEGORY_NAMES.includes(input.category)) return 'Choose a category.';
  if (typeof input.subcategory !== 'string' || !input.subcategory.trim()) return 'Choose or enter a subcategory.';
  if (!Number.isFinite(input.amount) || input.amount < 0) return 'Amount must be zero or more.';
  if (!Number.isInteger(input.day_of_month) || input.day_of_month < 1 || input.day_of_month > 31) return 'Day of month must be a whole number from 1 to 31.';
  if (typeof input.note !== 'string' || typeof input.active !== 'boolean') return 'Check the recurring transaction details.';
  return null;
};

export const isRecurringRule = (value: unknown): value is RecurringRule => {
  if (!value || typeof value !== 'object') return false;
  const rule = value as RecurringRule;
  return typeof rule.id === 'string' && !!rule.id && !recurringInputError(rule);
};

export const recurringItemsError = (items: RecurringApplyItem[]): string | null => {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item.rule_id !== 'string' || !item.rule_id || ids.has(item.rule_id)) return 'Select each recurring rule only once.';
    ids.add(item.rule_id);
    const error = recurringInputError({ ...item, active: true });
    if (error) return error;
  }
  return null;
};

export const recurringWriteFailure = (subject: string, error?: { code?: string } | null, status = 0): RecurringWriteResult => {
  // SQL rejections are safe to retry. Transport or response failures can follow a committed write.
  const rejected = status >= 400 && status < 600 && !!error?.code && /^(?=.*\d)[0-9A-Z]{5}$/.test(error.code);
  return rejected
    ? { error: `Could not save ${subject}. Please try again.` }
    : { error: `Could not confirm the change to ${subject}. Reload and check the saved state before trying again.`, uncertain: true };
};
