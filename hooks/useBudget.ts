import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Transaction, CategoryName, Subcategory, Subcategories, RecurringApplyItem } from '../types';
import { CATEGORY_NAMES } from '../types';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { currentMonthKey, monthDayToDate, resolveSourceMonth } from '../utils/dates';
import { transactionInputError, type TransactionInput } from '../utils/transactions';
import type { User } from '@supabase/supabase-js';

interface MonthData {
    transactions: Transaction[];
    subcategories: Subcategories;
}

export interface BudgetWriteResult {
    error: string | null;
}

export interface TransactionWriteResult extends BudgetWriteResult {
    uncertain?: boolean;
}

const transactionWriteFailure = (action: 'saved' | 'deleted', error?: { code?: string } | null, status = 0): TransactionWriteResult => {
    // A transport or representation failure can arrive after commit; only a server SQL rejection permits retry.
    const rejected = status >= 400 && status < 600 && !!error?.code && /^(?=.*\d)[0-9A-Z]{5}$/.test(error.code);
    return rejected
        ? { error: `This transaction could not be ${action}. Please try again.` }
        : { error: `Could not confirm whether this transaction was ${action}. Reload activity before trying again.`, uncertain: true };
};

export interface CreateMonthResult {
    created: boolean;
    error: string | null;
}

type AllBudgetData = Record<string, MonthData>;

const LOCAL_STORAGE_KEY = 'zenith-guest-budget';

const blankSubcategories: Subcategories = {
    Income: [], Expenses: [], Bills: [], Savings: [], Investments: [], Debts: [],
};

const byDateDesc = (a: Transaction, b: Transaction) =>
    new Date(b.date).getTime() - new Date(a.date).getTime();

// Make sure every subcategory a confirmed recurring item needs actually exists in
// `subs`, MUTATING `subs` to add any that don't. Mirrors the same fallback that
// TransactionForm applies to a hand-entered transaction: match case-insensitively,
// adopt the existing subcategory's canonical casing on a hit, and create at
// `expected: 0` on a miss. Creating at 0 never overwrites a budgeted amount — the
// line simply didn't exist before. Without this, a generated transaction would count
// toward its category total but have no subcategory row to appear in.
//
// Returns the items with their subcategory names canonicalised, plus whether
// anything was created (so callers know if `subs` needs persisting).
const backfillSubcategories = (subs: Subcategories, items: RecurringApplyItem[]) => {
    let created = false;
    const resolved = items.map(item => {
        const name = item.subcategory.trim();
        if (!subs[item.category]) subs[item.category] = [];
        const list = subs[item.category];
        const existing = list.find(s => s.name.toLowerCase() === name.toLowerCase());
        if (existing) return { ...item, subcategory: existing.name };
        list.push({ id: crypto.randomUUID(), name, expected: 0 });
        created = true;
        return { ...item, subcategory: name };
    });
    return { resolved, created };
};

// --- GUEST DEMO DATA ---
const getGuestInitialData = (): AllBudgetData => {
    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Named thisMonthKey rather than currentMonthKey so it doesn't shadow the imported helper.
    const thisMonthKey = currentMonthKey();
    const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const guestSubcategories = {
        Income: [{ id: 'sub-inc-1', name: 'Salary', expected: 5000 }],
        Expenses: [
            { id: 'sub-exp-1', name: 'Groceries', expected: 500 },
            { id: 'sub-exp-2', name: 'Eating Out', expected: 250 },
            { id: 'sub-exp-3', name: 'Gas', expected: 150 },
            { id: 'sub-exp-4', name: 'Shopping', expected: 200 },
        ],
        Bills: [
            { id: 'sub-bill-1', name: 'Rent', expected: 2000 },
            { id: 'sub-bill-2', name: 'Internet', expected: 60 },
            { id: 'sub-bill-3', name: 'Phone', expected: 90 },
            { id: 'sub-bill-4', name: 'Utilities', expected: 150 },
        ],
            Debts: [{ id: 'sub-debt-1', name: 'Student Loan', expected: 300 }],
            Savings: [
                { id: 'sub-save-1', name: 'Vacation Fund', expected: 300 },
                { id: 'sub-save-2', name: 'Emergency Fund', expected: 250 },
            ],
            Investments: [
                { id: 'sub-invest-1', name: 'Brokerage', expected: 200 },
            ],
    };

    const previousMonthTransactions: Transaction[] = [
        { id: 'guest-trans-1', date: `${previousMonthKey}-15`, category: 'Income', subcategory: 'Salary', amount: 5000, note: 'Paycheck' },
        { id: 'guest-trans-2', date: `${previousMonthKey}-02`, category: 'Expenses', subcategory: 'Groceries', amount: 120.50, note: 'Trader Joes' },
        { id: 'guest-trans-3', date: `${previousMonthKey}-05`, category: 'Expenses', subcategory: 'Eating Out', amount: 45.20, note: 'Pizza night' },
        { id: 'guest-trans-4', date: `${previousMonthKey}-08`, category: 'Expenses', subcategory: 'Gas', amount: 55.00, note: 'Shell' },
        { id: 'guest-trans-5', date: `${previousMonthKey}-12`, category: 'Expenses', subcategory: 'Shopping', amount: 89.99, note: 'New shoes' },
        { id: 'guest-trans-6', date: `${previousMonthKey}-16`, category: 'Expenses', subcategory: 'Groceries', amount: 150.75, note: 'Costco run' },
        { id: 'guest-trans-7', date: `${previousMonthKey}-22`, category: 'Expenses', subcategory: 'Eating Out', amount: 80.00, note: 'Dinner with friends' },
        { id: 'guest-trans-8', date: `${previousMonthKey}-01`, category: 'Bills', subcategory: 'Rent', amount: 2000, note: 'Monthly Rent' },
        { id: 'guest-trans-9', date: `${previousMonthKey}-10`, category: 'Bills', subcategory: 'Internet', amount: 60, note: 'Comcast' },
        { id: 'guest-trans-10', date: `${previousMonthKey}-18`, category: 'Bills', subcategory: 'Phone', amount: 90, note: 'Verizon' },
        { id: 'guest-trans-11', date: `${previousMonthKey}-25`, category: 'Bills', subcategory: 'Utilities', amount: 145.50, note: 'Power & Water' },
        { id: 'guest-trans-12', date: `${previousMonthKey}-28`, category: 'Debts', subcategory: 'Student Loan', amount: 300, note: 'Navient Payment' },
        { id: 'guest-trans-13', date: `${previousMonthKey}-15`, category: 'Savings', subcategory: 'Vacation Fund', amount: 300, note: 'Transfer' },
        { id: 'guest-trans-14', date: `${previousMonthKey}-15`, category: 'Savings', subcategory: 'Emergency Fund', amount: 250, note: 'Transfer' },
    ];

    const currentMonthTransactions: Transaction[] = [
        // Stamped so the drip recognises Rent as already applied this month and doesn't
        // add a second one. Internet (guest-rec-2, the 10th) is deliberately left unseeded
        // so the demo actually shows a recurring transaction arriving on its date.
        { id: 'guest-trans-15', date: `${thisMonthKey}-01`, category: 'Bills', subcategory: 'Rent', amount: 2000, note: 'Monthly Rent', recurring_id: 'guest-rec-1' },
        { id: 'guest-trans-16', date: `${thisMonthKey}-03`, category: 'Expenses', subcategory: 'Groceries', amount: 95.40, note: 'Safeway' },
    ];

    return {
        [previousMonthKey]: {
            transactions: previousMonthTransactions,
            subcategories: guestSubcategories,
        },
        [thisMonthKey]: {
            transactions: currentMonthTransactions,
            subcategories: JSON.parse(JSON.stringify(guestSubcategories)),
        }
    };
};
// --- END GUEST DEMO DATA ---

export const useBudget = (selectedMonth: string, currentUser: User | null) => {
    const [allData, setAllData] = useState<AllBudgetData>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadVersion, setLoadVersion] = useState(0);
    const retryLoad = useCallback(() => setLoadVersion(version => version + 1), []);

    // Mirrors `allData`, but updated synchronously. React state does not change
    // until the next render, so two mutations fired in the same tick — adding a new
    // subcategory and then the transaction that uses it — would both build on the
    // same stale snapshot and the second would clobber the first. Guest writes read
    // this instead of the `allData` closure.
    const allDataRef = useRef<AllBudgetData>(allData);
    const currentUserIdRef = useRef(currentUser?.id);
    currentUserIdRef.current = currentUser?.id;

    // The only way this hook should update allData. Accepts a value or an updater,
    // keeps the ref in step, and hands back what it committed so guest callers can
    // persist exactly that.
    const commitAllData = useCallback((
        updater: AllBudgetData | ((prev: AllBudgetData) => AllBudgetData)
    ): AllBudgetData => {
        const next = typeof updater === 'function' ? updater(allDataRef.current) : updater;
        allDataRef.current = next;
        setAllData(next);
        return next;
    }, []);

    // --- Local Storage Functions for Guest ---
    const getGuestDataFromStorage = (): AllBudgetData | null => {
        const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (rawData === null) return null;
        const data: unknown = JSON.parse(rawData);
        if (!data || typeof data !== 'object' || Array.isArray(data) || Object.values(data).some(month =>
            !month || typeof month !== 'object' || !Array.isArray(month.transactions)
            || !month.subcategories || typeof month.subcategories !== 'object' || Array.isArray(month.subcategories)
        )) throw new Error('The saved guest budget could not be read. It has not been replaced.');
        return data as AllBudgetData;
    };

    const setGuestDataInStorage = useCallback((data: AllBudgetData) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error("Error saving guest data to localStorage", error);
            return false;
        }
    }, []);
    // --- End Local Storage Functions ---

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setIsLoaded(false);
            setLoadError(null);
            try {
                if (!currentUser) {
                    commitAllData({});
                    return;
                }
                if (currentUser.id === GUEST_USER_ID) {
                    let guestData = getGuestDataFromStorage();
                    if (!guestData) {
                        guestData = getGuestInitialData();
                        if (!setGuestDataInStorage(guestData)) {
                            throw new Error('Could not save the starter budget on your device. Check browser storage and try again.');
                        }
                    }
                    commitAllData(guestData);
                    return;
                }

                const { data: budgets, error: budgetError } = await supabase
                    .from('budgets').select('month, subcategories').eq('user_id', currentUser.id);
                if (cancelled) return;
                if (budgetError || !budgets) throw new Error('Could not load your budgets. Please try again.');

                if (budgets.length === 0) {
                    const { data: newBudgets, error: createError } = await supabase.from('budgets').insert({
                        user_id: currentUser.id,
                        month: currentMonthKey(),
                        subcategories: blankSubcategories,
                    }).select('month, subcategories');
                    if (cancelled) return;
                    if (createError || !newBudgets?.length) throw new Error('Could not create your first budget month. Please try again.');
                    budgets.push(newBudgets[0]);
                }
                const { data: transactions, error: transError } = await supabase
                    .from('transactions').select('id, date, category, subcategory, amount, note, month, recurring_id')
                    .eq('user_id', currentUser.id);
                if (cancelled) return;
                if (transError || !transactions) throw new Error('Could not load your transactions. Please try again.');

                const newAllData: AllBudgetData = {};
                for (const budget of budgets) {
                    newAllData[budget.month] = { subcategories: budget.subcategories, transactions: [] };
                }
                for (const transaction of transactions) {
                    if (newAllData[transaction.month]) newAllData[transaction.month].transactions.push(transaction as Transaction);
                }
                for (const month in newAllData) newAllData[month].transactions.sort(byDateDesc);
                commitAllData(newAllData);
            } catch (error) {
                if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not load your budget. Please try again.');
            } finally {
                if (!cancelled) setIsLoaded(true);
            }
        };
        void fetchData();
        return () => { cancelled = true; };
    }, [currentUser, commitAllData, setGuestDataInStorage, loadVersion]);

    const currentMonthData = useMemo(() => allData[selectedMonth] || { transactions: [], subcategories: blankSubcategories }, [allData, selectedMonth]);

    const persistSubcategories = useCallback(async (subcategories: Subcategories): Promise<BudgetWriteResult> => {
        const previous = allDataRef.current[selectedMonth];
        if (!currentUser || currentUserIdRef.current !== currentUser.id || !previous) return { error: 'This budget month is not available. Reload before editing.' };
        const next = { ...allDataRef.current, [selectedMonth]: { ...previous, subcategories } };
        if (currentUser.id === GUEST_USER_ID) {
            if (!setGuestDataInStorage(next)) return { error: 'Could not save on your device. Check browser storage and try again.' };
            commitAllData(next);
            return { error: null };
        }
        try {
            const { data, error } = await supabase.from('budgets').update({ subcategories })
                .match({ user_id: currentUser.id, month: selectedMonth }).select('month');
            if (error || data?.length !== 1 || data[0].month !== selectedMonth) {
                return { error: 'Could not save this plan. Your budget may have changed or you may no longer have access. Reload or try again.' };
            }
            if (currentUserIdRef.current !== currentUser.id || !allDataRef.current[selectedMonth]) return { error: 'The account or month changed. Reload to check its saved plan.' };
            commitAllData(current => ({ ...current, [selectedMonth]: { ...current[selectedMonth], subcategories } }));
            return { error: null };
        } catch {
            return { error: 'Could not confirm the plan was saved. Reload to check before trying again.' };
        }
    }, [selectedMonth, currentUser, commitAllData, setGuestDataInStorage]);

    const commitTransactionChange = useCallback((
        mapper: (transactions: Transaction[]) => Transaction[]
    ): TransactionWriteResult => {
        const month = allDataRef.current[selectedMonth];
        if (!currentUser || currentUserIdRef.current !== currentUser.id || !month) return { error: 'This budget month is not available. Reload before editing.' };
        const next = {
            ...allDataRef.current,
            [selectedMonth]: { ...month, transactions: mapper(month.transactions) },
        };
        if (currentUser.id === GUEST_USER_ID && !setGuestDataInStorage(next)) {
            return { error: 'Could not save this change on your device. Check browser storage and try again.' };
        }
        commitAllData(next);
        return { error: null };
    }, [selectedMonth, currentUser, commitAllData, setGuestDataInStorage]);

    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>): Promise<TransactionWriteResult> => {
        const month = allDataRef.current[selectedMonth];
        if (!currentUser || currentUserIdRef.current !== currentUser.id || !month) return { error: 'This budget month is not available. Reload before adding a transaction.' };
        const validation = transactionInputError(transaction, selectedMonth);
        if (validation) return { error: validation };
        const subcategory = month.subcategories[transaction.category]?.find(sub => sub.name.toLowerCase() === transaction.subcategory.trim().toLowerCase());
        if (!subcategory) return { error: 'Save this subcategory before adding its transaction.' };
        const input: TransactionInput = { date: transaction.date, amount: transaction.amount, category: transaction.category, subcategory: subcategory.name, note: transaction.note };
        if (currentUser.id === GUEST_USER_ID) {
            const record: Transaction = { ...input, id: crypto.randomUUID() };
            return commitTransactionChange(transactions => [record, ...transactions].sort(byDateDesc));
        }
        try {
            const { data, error, status } = await supabase.from('transactions').insert({ ...input, user_id: currentUser.id, month: selectedMonth }).select().single();
            if (error || !data || typeof data.id !== 'string') return transactionWriteFailure('saved', error, status);
            const result = commitTransactionChange(transactions => [data as Transaction, ...transactions].sort(byDateDesc));
            return result.error ? { error: 'The transaction was saved, but this month is no longer loaded. Reload activity to view it.', uncertain: true } : result;
        } catch {
            return transactionWriteFailure('saved');
        }
    }, [selectedMonth, currentUser, commitTransactionChange]);

    const updateTransaction = useCallback(async (updatedTransaction: Transaction): Promise<TransactionWriteResult> => {
        const month = allDataRef.current[selectedMonth];
        const original = month?.transactions.find(transaction => transaction.id === updatedTransaction.id);
        if (!currentUser || currentUserIdRef.current !== currentUser.id || !original) return { error: 'This transaction is no longer available in this month. Reload activity.' };
        const validation = transactionInputError(updatedTransaction, selectedMonth);
        if (validation) return { error: validation };
        const subcategory = month.subcategories[updatedTransaction.category]?.find(sub => sub.name === updatedTransaction.subcategory);
        if (!subcategory && !(original.category === updatedTransaction.category && original.subcategory === updatedTransaction.subcategory)) {
            return { error: 'Choose an existing subcategory for this category.' };
        }
        const fields: TransactionInput = { date: updatedTransaction.date, amount: updatedTransaction.amount, category: updatedTransaction.category, subcategory: updatedTransaction.subcategory, note: updatedTransaction.note };
        const applyEdit = (transactions: Transaction[]) => transactions.map(transaction => transaction.id === original.id ? { ...transaction, ...fields } : transaction).sort(byDateDesc);
        if (currentUser.id === GUEST_USER_ID) return commitTransactionChange(applyEdit);
        try {
            const { data, error, status } = await supabase.from('transactions').update(fields)
                .match({ id: original.id, user_id: currentUser.id, month: selectedMonth }).select('id');
            if (error) return transactionWriteFailure('saved', error, status);
            if (data?.length !== 1 || data[0].id !== original.id) return { error: 'No updated transaction was returned. Reload activity or try again.' };
            const result = commitTransactionChange(applyEdit);
            return result.error ? { error: 'The transaction was saved. Reload activity to view it.', uncertain: true } : result;
        } catch {
            return transactionWriteFailure('saved');
        }
    }, [selectedMonth, currentUser, commitTransactionChange]);

    const deleteTransaction = useCallback(async (id: string): Promise<TransactionWriteResult> => {
        if (!currentUser || currentUserIdRef.current !== currentUser.id || !allDataRef.current[selectedMonth]?.transactions.some(transaction => transaction.id === id)) {
            return { error: 'This transaction is no longer available in this month. Reload activity.' };
        }
        const applyDelete = (transactions: Transaction[]) => transactions.filter(transaction => transaction.id !== id);
        if (currentUser.id === GUEST_USER_ID) return commitTransactionChange(applyDelete);
        try {
            const { data, error, status } = await supabase.from('transactions').delete()
                .match({ id, user_id: currentUser.id, month: selectedMonth }).select('id');
            if (error) return transactionWriteFailure('deleted', error, status);
            if (data?.length !== 1 || data[0].id !== id) return { error: 'No deleted transaction was returned. Reload activity or try again.' };
            const result = commitTransactionChange(applyDelete);
            return result.error ? { error: 'The transaction was deleted. Reload activity to see the current month.', uncertain: true } : result;
        } catch {
            return transactionWriteFailure('deleted');
        }
    }, [selectedMonth, currentUser, commitTransactionChange]);

    const addSubcategory = useCallback(async (category: CategoryName, name: string, expected = 0) => {
        if (!name.trim() || !Number.isFinite(expected)) return { error: 'Enter a name and a valid planned amount.', subcategory: null };
        const subs = allDataRef.current[selectedMonth]?.subcategories;
        if (!subs) return { error: 'This budget month is not available. Reload before editing.', subcategory: null };
        const subcategory: Subcategory = { id: crypto.randomUUID(), name: name.trim(), expected };
        const result = await persistSubcategories({ ...subs, [category]: [...(subs[category] || []), subcategory] });
        return { ...result, subcategory: result.error ? null : subcategory };
    }, [selectedMonth, persistSubcategories]);

    const deleteSubcategory = useCallback(async (category: CategoryName, id: string): Promise<BudgetWriteResult> => {
        const subs = allDataRef.current[selectedMonth]?.subcategories;
        if (!subs?.[category]?.some(sub => sub.id === id)) return { error: 'This subcategory is no longer available. Close the editor and reload.' };
        return persistSubcategories({ ...subs, [category]: subs[category].filter(sub => sub.id !== id) });
    }, [selectedMonth, persistSubcategories]);

    const updateSubcategory = useCallback(async (category: CategoryName, id: string, newName: string) => {
        const subs = allDataRef.current[selectedMonth]?.subcategories;
        if (!subs?.[category]?.some(sub => sub.id === id)) return { error: 'This subcategory is no longer available.' };
        return persistSubcategories({ ...subs, [category]: subs[category].map(sub => sub.id === id ? { ...sub, name: newName } : sub) });
    }, [selectedMonth, persistSubcategories]);

    const saveSubcategoryPlan = useCallback(async (
        category: CategoryName, id: string, expected: number, excludeFromBudget: boolean
    ): Promise<BudgetWriteResult> => {
        if (!Number.isFinite(expected)) return { error: 'Enter a valid planned amount.' };
        const subs = allDataRef.current[selectedMonth]?.subcategories;
        if (!subs?.[category]?.some(sub => sub.id === id)) return { error: 'This subcategory is no longer available. Close the editor and reload.' };
        return persistSubcategories({ ...subs, [category]: subs[category].map(sub => sub.id === id ? { ...sub, expected, excludeFromBudget } : sub) });
    }, [selectedMonth, persistSubcategories]);

    const actualAmounts = useMemo(() => {
        return currentMonthData.transactions.reduce((acc, transaction) => {
            // Check if the transaction's subcategory is excluded from budget
            const categorySubcategories = currentMonthData.subcategories[transaction.category] || [];
            const subcategory = categorySubcategories.find(sub => sub.name === transaction.subcategory);

            // Skip if excluded from budget
            if (subcategory?.excludeFromBudget) {
                return acc;
            }

            acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
            return acc;
        }, {} as Record<CategoryName, number>);
    }, [currentMonthData.transactions, currentMonthData.subcategories]);

    const actualsBySubcategory = useMemo(() => {
        const bySub: Record<CategoryName, Record<string, number>> = { Income: {}, Expenses: {}, Bills: {}, Savings: {}, Investments: {}, Debts: {} };
        for (const transaction of currentMonthData.transactions) {
            const { category, subcategory, amount } = transaction;
            if (!bySub[category]) bySub[category] = {};
            if (!bySub[category][subcategory]) bySub[category][subcategory] = 0;
            bySub[category][subcategory] += amount;
        }
        return bySub;
    }, [currentMonthData.transactions]);

    const expectedAmounts = useMemo(() => {
        const newExpected: Record<CategoryName, number> = { Income: 0, Expenses: 0, Bills: 0, Savings: 0, Investments: 0, Debts: 0 };
        for (const category of CATEGORY_NAMES) {
            newExpected[category] = currentMonthData.subcategories[category]?.reduce((sum, sub) => {
                // Skip subcategories excluded from budget
                if (sub.excludeFromBudget) return sum;
                return sum + sub.expected;
            }, 0) || 0;
        }
        return newExpected;
    }, [currentMonthData.subcategories]);

    // Accept an optional sourceMonth when copying, plus any recurring transactions
    // the user confirmed in the New Month checklist.
    const createNewMonth = useCallback(async (
        month: string,
        option: 'copy' | 'blank' | 'scratch',
        sourceMonth?: string,
        recurringToApply: RecurringApplyItem[] = []
    ): Promise<CreateMonthResult> => {
        const dataAtStart = allDataRef.current;
        if (!currentUser) return { created: false, error: 'Sign in before creating a budget month.' };
        if (dataAtStart[month]) return { created: false, error: 'A budget already exists for this month.' };

        let subcategoriesToUse: Subcategories;
        if (option === 'scratch') {
            // Clone rather than reference: the recurring back-fill below mutates
            // `subcategoriesToUse`, and `blankSubcategories` is a shared module-level
            // constant also used as the empty-month fallback.
            subcategoriesToUse = JSON.parse(JSON.stringify(blankSubcategories));
        } else {
            const sourceToUse = resolveSourceMonth(Object.keys(dataAtStart), month, sourceMonth);
            const subcategoriesToCopyFrom = sourceToUse ? dataAtStart[sourceToUse].subcategories : blankSubcategories;
            subcategoriesToUse = JSON.parse(JSON.stringify(subcategoriesToCopyFrom));

            if (option === 'blank') {
                for (const category in subcategoriesToUse) {
                    (subcategoriesToUse[category as CategoryName] as Subcategory[]).forEach(sub => { sub.expected = 0; });
                }
            }
        }

        const { resolved } = backfillSubcategories(subcategoriesToUse, recurringToApply);

        if (currentUser.id === GUEST_USER_ID) {
            const guestTransactions: Transaction[] = resolved.map(item => ({
                id: crypto.randomUUID(),
                date: monthDayToDate(month, item.day_of_month),
                category: item.category,
                subcategory: item.subcategory,
                amount: item.amount,
                note: item.note,
                recurring_id: item.rule_id,
            })).sort(byDateDesc);

            const nextData = {
                ...allDataRef.current,
                [month]: { transactions: guestTransactions, subcategories: subcategoriesToUse }
            };
            if (!setGuestDataInStorage(nextData)) {
                return { created: false, error: 'Could not save this month on your device. Check available browser storage and try again.' };
            }
            commitAllData(nextData);
            return { created: true, error: null };
        }

        commitAllData(prev => ({ ...prev, [month]: { transactions: [], subcategories: subcategoriesToUse } }));

        // Budget row first, always. A transaction whose month has no budget row is
        // dropped on every reload, which would make it invisible and undeletable.
        const { error } = await supabase.from('budgets').insert({ user_id: currentUser.id, month: month, subcategories: subcategoriesToUse });
        if (error) {
            console.error("Error creating new month:", error);
            commitAllData(prev => {
                const reverted = { ...prev };
                delete reverted[month];
                return reverted;
            });
            return { created: false, error: 'Could not create this budget month. Please try again.' };
        }

        if (resolved.length === 0) return { created: true, error: null };

        const rows = resolved.map(item => ({
            user_id: currentUser.id,
            month,
            date: monthDayToDate(month, item.day_of_month),
            category: item.category,
            subcategory: item.subcategory,
            amount: item.amount,
            note: item.note,
            recurring_id: item.rule_id,
        }));

        // One array insert is a single statement, so the rows all land or none do.
        const { data, error: transError } = await supabase.from('transactions').insert(rows).select();
        if (transError || !data) {
            // The month itself was created correctly — keep it. The user can retry the
            // recurring transactions from the Budget page rather than lose the month.
            console.error("Error adding recurring transactions:", transError);
            return { created: true, error: 'Recurring transactions could not be added. Open this month and use Apply recurring to try those transactions again.' };
        }

        commitAllData(prev => ({
            ...prev,
            [month]: { ...prev[month], transactions: (data as Transaction[]).sort(byDateDesc) }
        }));
        return { created: true, error: null };
    }, [currentUser, commitAllData, setGuestDataInStorage]);

    // Apply confirmed recurring items to a month that already exists — for months
    // created before a rule was added. Takes `month` explicitly rather than using
    // `selectedMonth` so it can never write to the wrong month.
    const applyRecurringToMonth = useCallback(async (month: string, items: RecurringApplyItem[]) => {
        const monthData = allDataRef.current[month];
        if (!currentUser || !monthData || items.length === 0) return;

        const nextSubcategories: Subcategories = JSON.parse(JSON.stringify(monthData.subcategories));
        const { resolved, created } = backfillSubcategories(nextSubcategories, items);

        if (currentUser.id === GUEST_USER_ID) {
            const guestTransactions: Transaction[] = resolved.map(item => ({
                id: crypto.randomUUID(),
                date: monthDayToDate(month, item.day_of_month),
                category: item.category,
                subcategory: item.subcategory,
                amount: item.amount,
                note: item.note,
                recurring_id: item.rule_id,
            }));

            setGuestDataInStorage(commitAllData(prev => ({
                ...prev,
                [month]: {
                    subcategories: nextSubcategories,
                    transactions: [...guestTransactions, ...(prev[month]?.transactions || [])].sort(byDateDesc),
                }
            })));
            return;
        }

        // Subcategories first, so every new transaction has a row to display in.
        if (created) {
            const { error } = await supabase.from('budgets')
                .update({ subcategories: nextSubcategories })
                .match({ user_id: currentUser.id, month });
            if (error) {
                console.error("Error adding subcategories for recurring transactions:", error);
                return;
            }
        }

        const rows = resolved.map(item => ({
            user_id: currentUser.id,
            month,
            date: monthDayToDate(month, item.day_of_month),
            category: item.category,
            subcategory: item.subcategory,
            amount: item.amount,
            note: item.note,
            recurring_id: item.rule_id,
        }));

        const { data, error } = await supabase.from('transactions').insert(rows).select();
        if (error || !data) {
            console.error("Error adding recurring transactions:", error);
            return;
        }

        commitAllData(prev => ({
            ...prev,
            [month]: {
                subcategories: nextSubcategories,
                transactions: [...(data as Transaction[]), ...(prev[month]?.transactions || [])].sort(byDateDesc),
            }
        }));
    }, [currentUser, commitAllData, setGuestDataInStorage]);

    const deleteMonth = useCallback(async (monthToDelete: string): Promise<{ error: string | null }> => {
        const prevAllData = allDataRef.current;
        if (!currentUser || Object.keys(prevAllData).length <= 1) {
            console.error("Cannot delete the only budget month.");
            return { error: 'Keep at least one budget month.' };
        }

        const newData = { ...prevAllData };
        delete newData[monthToDelete];

        if (currentUser.id === GUEST_USER_ID) {
            if (!setGuestDataInStorage(newData)) {
                return { error: 'Could not save this change on your device. This month has not been deleted. Check available browser storage and try again.' };
            }
            commitAllData(newData);
            return { error: null };
        }

        commitAllData(newData);
        const { error: budgetError } = await supabase.from('budgets').delete().match({ user_id: currentUser.id, month: monthToDelete });
        const { error: transError } = await supabase.from('transactions').delete().match({ user_id: currentUser.id, month: monthToDelete });

        if (budgetError || transError) {
            console.error("Error deleting month:", budgetError || transError);
            commitAllData(prevAllData); // Revert
            return { error: 'Could not finish deleting this month. Reload to check its status before trying again.' };
        }
        return { error: null };
    }, [currentUser, commitAllData, setGuestDataInStorage]);

    const totalExpectedIncome = expectedAmounts.Income;
    const totalExpectedSpending = (expectedAmounts.Expenses + expectedAmounts.Bills + expectedAmounts.Savings + expectedAmounts.Investments + expectedAmounts.Debts);
    const remainingToBudget = totalExpectedIncome - totalExpectedSpending;

    const totalActualIncome = actualAmounts.Income || 0;
    const totalActualSpending = (actualAmounts.Expenses || 0) + (actualAmounts.Bills || 0) + (actualAmounts.Savings || 0) + (actualAmounts.Investments || 0) + (actualAmounts.Debts || 0);
    const remainingToSpend = totalActualIncome - totalActualSpending;

    const availableMonths = useMemo(() => Object.keys(allData).sort().reverse(), [allData]);

    return {
        isLoaded,
        loadError,
        retryLoad,
        transactions: currentMonthData.transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        subcategories: currentMonthData.subcategories,
        addSubcategory,
        deleteSubcategory,
        updateSubcategory,
        saveSubcategoryPlan,
        actualAmounts,
        expectedAmounts,
        actualsBySubcategory,
        remainingToBudget,
        remainingToSpend,
        availableMonths,
        createNewMonth,
        applyRecurringToMonth,
        deleteMonth,
        allData, // Shared with month setup and automatic recurring application
    };
};
