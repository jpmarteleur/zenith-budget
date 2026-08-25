import { useEffect, useRef } from 'react';
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
    applyRecurringToMonth: (month: string, items: RecurringApplyItem[]) => Promise<void>;
}

// How far through each month the drip has already run, as "userId:month" -> day of month.
//
// Without this the feature has no memory of what it has done, only of what exists — so
// deleting an auto-added transaction makes its rule read as due-and-unapplied again and
// the effect immediately puts it back. Recording the high-water mark makes the drip
// advance-only: it will add day 25 tomorrow, but never re-add day 10.
const WATERMARK_KEY = 'zenith-recurring-watermark';

const readWatermarks = (): Record<string, number> => {
    try {
        return JSON.parse(localStorage.getItem(WATERMARK_KEY) || '{}');
    } catch (error) {
        console.error('Error reading recurring watermark', error);
        return {};
    }
};

const readWatermark = (userId: string, month: string): number =>
    readWatermarks()[`${userId}:${month}`] || 0;

const writeWatermark = (userId: string, month: string, day: number) => {
    try {
        const all = readWatermarks();
        const key = `${userId}:${month}`;
        if (all[key] === day) return;
        all[key] = day;
        localStorage.setItem(WATERMARK_KEY, JSON.stringify(all));
    } catch (error) {
        console.error('Error saving recurring watermark', error);
    }
};

// Drips recurring rules into the current month as each one's day arrives, so a month
// doesn't open with every subscription already "spent". Rent (day 1) shows on the 1st;
// Netflix (day 28) turns up on the 28th. Nothing here is a new write path — it decides
// what is due and hands it to the existing applyRecurringToMonth, which already covers
// subcategory backfill, guest vs Supabase, optimistic state and rollback.
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
    const inFlight = useRef(false);

    useEffect(() => {
        if (!currentUser || !isRecurringLoaded || !isBudgetLoaded) return;
        if (inFlight.current) return;

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
        const watermark = readWatermark(currentUser.id, month);

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
            writeWatermark(currentUser.id, month, todayDay);
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

        inFlight.current = true;
        // Self-limiting: once these land, their ids are in appliedRuleIds, so the re-run
        // this write triggers finds nothing due and stops.
        applyRecurringToMonth(month, items)
            // Advanced only on success, so a failed write is retried on the next open
            // rather than being silently skipped for good.
            .then(() => writeWatermark(currentUser.id, month, todayDay))
            .catch(error => console.error('Error auto-applying recurring transactions:', error))
            .finally(() => { inFlight.current = false; });
    }, [currentUser, activeRules, isRecurringLoaded, isBudgetLoaded, allData, applyRecurringToMonth]);
};
