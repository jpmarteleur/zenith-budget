import { useEffect, useRef, useState } from 'react';
import type { RecurringWriteResult } from '../utils/recurring';
import type { User } from '@supabase/supabase-js';
import type { RecurringApplyItem, RecurringRule, Subcategories, Transaction } from '../types';
import { currentMonthKey, isDueOn, monthDayToDate, todayKey } from '../utils/dates';

interface MonthData {
    transactions: Transaction[];
    subcategories: Subcategories;
}

interface UseRecurringAutoApplyArgs {
    currentUser: User | null;
    activeRules: RecurringRule[];
    isRecurringLoaded: boolean;
    isBudgetLoaded: boolean;
    allData: Record<string, MonthData>;
    applyRecurringToMonth: (month: string, items: RecurringApplyItem[]) => Promise<RecurringWriteResult>;
}

// How far through each month the drip has already run, as "userId:month" -> day of month.
//
// Without this the feature has no memory of what it has done, only of what exists — so
// deleting an auto-added transaction makes its rule read as due-and-unapplied again and
// the effect immediately puts it back. Recording the high-water mark makes the drip
// advance-only: it will add day 25 tomorrow, but never re-add day 10.
const WATERMARK_KEY = 'zenith-recurring-watermark';

const readWatermarks = (): Record<string, number> => {
    const value: unknown = JSON.parse(localStorage.getItem(WATERMARK_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(day => !Number.isInteger(day) || day < 0 || day > 31)) {
        throw new Error('Saved recurring application history could not be read.');
    }
    return value as Record<string, number>;
};
const readWatermark = (userId: string, month: string): number => readWatermarks()[`${userId}:${month}`] || 0;
const writeWatermark = (userId: string, month: string, day: number): boolean => {
    try {
        const all = readWatermarks();
        const key = `${userId}:${month}`;
        if (all[key] !== day) {
            all[key] = day;
            localStorage.setItem(WATERMARK_KEY, JSON.stringify(all));
        }
        return true;
    } catch { return false; }
};

// Drips recurring rules into the current month as each one's day arrives, so a month
// doesn't open with every subscription already "spent". Rent (day 1) shows on the 1st;
// Netflix (day 28) turns up on the 28th. Nothing here is a new write path — it decides
// what is due and hands it to the existing applyRecurringToMonth, which already covers
// subcategory backfill and confirmed guest or Supabase persistence.
//
// Current month only, always. Months already in the user's history are finished budgets
// and must never gain charges retroactively, however long the app has been closed.
export const useRecurringAutoApply = ({
    currentUser,
    activeRules,
    isRecurringLoaded,
    isBudgetLoaded,
    allData,
    applyRecurringToMonth,
}: UseRecurringAutoApplyArgs) => {
    // applyRecurringToMonth commits to allData, which re-runs this effect while the insert
    // is still awaiting. Without this guard that second pass sees the pre-insert
    // transactions and files everything a second time.
    const inFlight = useRef<object | null>(null);
    // A failed due set waits for reload or manual application instead of retrying on every render.
    const attempted = useRef<string | null>(null);
    const [failure, setFailure] = useState<{ user: string; error: string } | null>(null);
    const session = useRef({ id: currentUser?.id });
    if (session.current.id !== currentUser?.id) { session.current = { id: currentUser?.id }; attempted.current = null; }
    const owner = session.current;

    useEffect(() => {
        if (!currentUser || !isRecurringLoaded || !isBudgetLoaded) return;
        if (inFlight.current === owner) return;

        const month = currentMonthKey();
        const monthData = allData[month];

        // No budget row for this month yet — nothing to write into. useBudget drops any
        // transaction whose month has no matching budget on every reload, so inserting
        // here would produce rows the user can neither see nor delete.
        if (!monthData) return;

        const appliedRuleIds = new Set(
            monthData.transactions.map(t => t.recurring_id).filter(Boolean) as string[]
        );

        const today = todayKey();
        const todayDay = Number(today.slice(8, 10));
        let watermark: number;
        try { watermark = readWatermark(currentUser.id, month); }
        catch {
            setFailure({ user: currentUser.id, error: 'Could not read recurring application history on this device. Automatic application is paused. Check browser storage and reload.' });
            return;
        }
        const saveWatermark = () => {
            const saved = writeWatermark(currentUser.id, month, todayDay);
            setFailure(saved ? null : { user: currentUser.id, error: 'Could not save recurring application history on this device. Check browser storage before deleting generated transactions, then reload.' });
        };

        const due = activeRules.filter(rule => {
            if (appliedRuleIds.has(rule.id)) return false;
            if (!isDueOn(month, rule.day_of_month, today)) return false;
            // Resolved rather than raw, so a day-31 rule is compared on the day it
            // actually lands — the same clamping isDueOn relies on.
            return Number(monthDayToDate(month, rule.day_of_month).slice(8, 10)) > watermark;
        });

        if (due.length === 0) {
            // Nothing outstanding: record that this month is caught up through today, so a
            // transaction the user deletes later isn't mistaken for one never added.
            saveWatermark();
            return;
        }

        const items: RecurringApplyItem[] = due.map(rule => ({
            rule_id: rule.id,
            category: rule.category,
            subcategory: rule.subcategory,
            amount: rule.amount,
            note: rule.note,
            day_of_month: rule.day_of_month,
        }));

        const attempt = `${currentUser.id}:${month}:${today}:${due.map(rule => rule.id).join(',')}`;
        if (attempted.current === attempt) return;
        attempted.current = attempt;
        inFlight.current = owner;
        // Self-limiting: once these land, their ids are in appliedRuleIds, so the re-run
        // this write triggers finds nothing due and stops.
        applyRecurringToMonth(month, items)
            // Advanced only on success, so a failed write is retried on the next open
            // rather than being silently skipped for good.
            .then(result => {
                if (session.current !== owner) return;
                if (result.error) setFailure({ user: currentUser.id, error: result.error });
                else {
                    saveWatermark();
                }
            })
            .catch(() => { if (session.current === owner) setFailure({ user: currentUser.id, error: 'Could not confirm recurring transactions. Reload and check history before trying again.' }); })
            .finally(() => { if (inFlight.current === owner) inFlight.current = null; });
    }, [currentUser, owner, activeRules, isRecurringLoaded, isBudgetLoaded, allData, applyRecurringToMonth]);
    return failure?.user === currentUser?.id ? failure.error : null;
};
