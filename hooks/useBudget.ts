import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Transaction, CategoryName, Subcategory, Subcategories, RecurringApplyItem } from '../types';
import { CATEGORY_NAMES } from '../types';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { monthDayToDate, resolveSourceMonth } from '../utils/dates';
import type { User } from '@supabase/supabase-js';

interface MonthData {
    transactions: Transaction[];
    subcategories: Subcategories;
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
// toward its category total but have no row in CategoryCard to appear in.
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
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthKey = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
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
        { id: 'guest-trans-15', date: `${currentMonthKey}-01`, category: 'Bills', subcategory: 'Rent', amount: 2000, note: 'Monthly Rent' },
        { id: 'guest-trans-16', date: `${currentMonthKey}-03`, category: 'Expenses', subcategory: 'Groceries', amount: 95.40, note: 'Safeway' },
    ];

    return {
        [previousMonthKey]: {
            transactions: previousMonthTransactions,
            subcategories: guestSubcategories,
        },
        [currentMonthKey]: {
            transactions: currentMonthTransactions,
            subcategories: JSON.parse(JSON.stringify(guestSubcategories)),
        }
    };
};
// --- END GUEST DEMO DATA ---

export const useBudget = (selectedMonth: string, currentUser: User | null) => {
    const [allData, setAllData] = useState<AllBudgetData>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Mirrors `allData`, but updated synchronously. React state does not change
    // until the next render, so two mutations fired in the same tick — adding a new
    // subcategory and then the transaction that uses it — would both build on the
    // same stale snapshot and the second would clobber the first. Guest writes read
    // this instead of the `allData` closure.
    const allDataRef = useRef<AllBudgetData>(allData);

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
        try {
            const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
            return rawData ? JSON.parse(rawData) : null;
        } catch (error) {
            console.error("Error reading guest data from localStorage", error);
            return null;
        }
    };

    const setGuestDataInStorage = useCallback((data: AllBudgetData) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving guest data to localStorage", error);
        }
    }, []);
    // --- End Local Storage Functions ---

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                commitAllData({});
                setIsLoaded(true);
                return;
            };

            setIsLoaded(false);

            // --- GUEST LOGIC ---
            if (currentUser.id === GUEST_USER_ID) {
                let guestData = getGuestDataFromStorage();
                if (!guestData) {
                    // First time guest, populate with demo data
                    guestData = getGuestInitialData();
                    setGuestDataInStorage(guestData);
                }
                commitAllData(guestData);
                setIsLoaded(true);
                return;
            }

            // --- SUPABASE LOGIC (for logged-in users) ---
            const { data: budgets, error: budgetError } = await supabase
                .from('budgets')
                .select('month, subcategories')
                .eq('user_id', currentUser.id);

            if (budgetError) {
                console.error("Error fetching budgets:", budgetError);
                setIsLoaded(true);
                return;
            }

            // If no budgets exist for a regular user, create the first one.
            if (budgets.length === 0) {
                const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const { data: newBudgets } = await supabase.from('budgets').insert({
                    user_id: currentUser.id,
                    month: currentMonth,
                    subcategories: blankSubcategories,
                }).select('month, subcategories');

                if (newBudgets && newBudgets.length > 0) {
                    budgets.push(newBudgets[0]);
                }
            }

            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('id, date, category, subcategory, amount, note, month, recurring_id')
                .eq('user_id', currentUser.id);

            if (transError) {
                console.error("Error fetching transactions:", transError);
                setIsLoaded(true);
                return;
            }

            const newAllData: AllBudgetData = {};
            for (const budget of budgets) {
                newAllData[budget.month] = {
                    subcategories: budget.subcategories,
                    transactions: [],
                };
            }
            for (const transaction of transactions) {
                if (newAllData[transaction.month]) {
                    newAllData[transaction.month].transactions.push(transaction as Transaction);
                }
            }

            for (const month in newAllData) {
                newAllData[month].transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }

            commitAllData(newAllData);
            setIsLoaded(true);
        };

        fetchData();
    }, [currentUser, commitAllData, setGuestDataInStorage]);

    const currentMonthData = useMemo(() => allData[selectedMonth] || { transactions: [], subcategories: blankSubcategories }, [allData, selectedMonth]);

    const updateMonthData = useCallback(async (data: Partial<MonthData>) => {
        if (!currentUser) return;

        const prevAllData = allDataRef.current;
        const newAllData = commitAllData(prev => ({
            ...prev,
            [selectedMonth]: {
                ...(prev[selectedMonth] || { transactions: [], subcategories: blankSubcategories }),
                ...data,
            }
        }));

        if (currentUser.id === GUEST_USER_ID) {
            setGuestDataInStorage(newAllData);
            return;
        }

        // Persist to Supabase
        if (data.subcategories) {
            const { error } = await supabase.from('budgets')
                .update({ subcategories: data.subcategories })
                .match({ user_id: currentUser.id, month: selectedMonth });
            if (error) {
                console.error("Error updating subcategories:", error);
                commitAllData(prevAllData); // Revert on error
            }
        }
    }, [selectedMonth, currentUser, commitAllData, setGuestDataInStorage]);

    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>): Promise<{ error: string | null }> => {
        if (!currentUser) return { error: 'You must be signed in to add a transaction.' };

        if (currentUser.id === GUEST_USER_ID) {
            const newTransaction: Transaction = { ...transaction, id: crypto.randomUUID() };
            // Built from the live ref, not the render's snapshot: the caller may have
            // just created a subcategory for this transaction in the same tick.
            const newAllData = commitAllData(prev => {
                const currentMonth = prev[selectedMonth] || { transactions: [], subcategories: blankSubcategories };
                return {
                    ...prev,
                    [selectedMonth]: {
                        ...currentMonth,
                        transactions: [newTransaction, ...currentMonth.transactions].sort(byDateDesc),
                    }
                };
            });
            setGuestDataInStorage(newAllData);
            return { error: null };
        }

        const transactionData = { ...transaction, user_id: currentUser.id, month: selectedMonth };
        const { data, error } = await supabase.from('transactions').insert(transactionData).select().single();

        if (error || !data) {
            console.error("Error adding transaction:", error);
            return { error: error?.message ?? 'Failed to save transaction.' };
        }

        const newTransaction: Transaction = data as Transaction;
        commitAllData(prev => {
            const currentMonth = prev[selectedMonth] || { transactions: [], subcategories: blankSubcategories };
            return {
                ...prev,
                [selectedMonth]: {
                    ...currentMonth,
                    transactions: [newTransaction, ...currentMonth.transactions].sort(byDateDesc),
                }
            };
        });
        return { error: null };
    }, [selectedMonth, currentUser, commitAllData, setGuestDataInStorage]);

    // Rewrites just this month's transaction list, always from the latest committed
    // data rather than the render's snapshot.
    const commitTransactions = useCallback((
        mapper: (transactions: Transaction[]) => Transaction[]
    ): AllBudgetData => commitAllData(prev => {
        const currentMonth = prev[selectedMonth] || { transactions: [], subcategories: blankSubcategories };
        return { ...prev, [selectedMonth]: { ...currentMonth, transactions: mapper(currentMonth.transactions) } };
    }), [commitAllData, selectedMonth]);

    const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
        if (!currentUser) return;
        const applyEdit = (ts: Transaction[]) =>
            ts.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);

        if (currentUser.id === GUEST_USER_ID) {
            setGuestDataInStorage(commitTransactions(applyEdit));
            return;
        }

        const { id, ...updateData } = updatedTransaction;
        const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
        if (error) {
            console.error("Error updating transaction:", error);
            return;
        }
        commitTransactions(applyEdit);
    }, [selectedMonth, currentUser, commitTransactions, setGuestDataInStorage]);

    const deleteTransaction = useCallback(async (id: string) => {
        if (!currentUser) return;
        const applyDelete = (ts: Transaction[]) => ts.filter(t => t.id !== id);

        if (currentUser.id === GUEST_USER_ID) {
            setGuestDataInStorage(commitTransactions(applyDelete));
            return;
        }

        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
            console.error("Error deleting transaction:", error);
            return;
        }
        commitTransactions(applyDelete);
    }, [selectedMonth, currentUser, commitTransactions, setGuestDataInStorage]);

    const addSubcategory = useCallback(async (category: CategoryName, name: string, expected = 0) => {
        const newSub: Subcategory = { id: crypto.randomUUID(), name, expected };
        const currentSubs = currentMonthData.subcategories[category] || [];
        const newSubcategories = { ...currentMonthData.subcategories, [category]: [...currentSubs, newSub] };
        await updateMonthData({ subcategories: newSubcategories });
        return newSub;
    }, [currentMonthData.subcategories, updateMonthData]);

    const deleteSubcategory = useCallback(async (category: CategoryName, id: string) => {
        const newSubcategories = { ...currentMonthData.subcategories, [category]: currentMonthData.subcategories[category].filter(sub => sub.id !== id) };
        await updateMonthData({ subcategories: newSubcategories });
    }, [currentMonthData.subcategories, updateMonthData]);

    const updateSubcategory = useCallback(async (category: CategoryName, id: string, newName: string) => {
        const newSubcategories = { ...currentMonthData.subcategories, [category]: currentMonthData.subcategories[category].map(sub => sub.id === id ? { ...sub, name: newName } : sub) };
        await updateMonthData({ subcategories: newSubcategories });
    }, [currentMonthData.subcategories, updateMonthData]);

    const updateSubcategoryExpected = useCallback(async (category: CategoryName, id: string, amount: number) => {
        const newSubcategories = { ...currentMonthData.subcategories, [category]: currentMonthData.subcategories[category].map(sub => sub.id === id ? { ...sub, expected: amount } : sub) };
        await updateMonthData({ subcategories: newSubcategories });
    }, [currentMonthData.subcategories, updateMonthData]);

    const toggleSubcategoryExcludeFromBudget = useCallback(async (category: CategoryName, id: string) => {
        const newSubcategories = {
            ...currentMonthData.subcategories,
            [category]: currentMonthData.subcategories[category].map(sub =>
                sub.id === id ? { ...sub, excludeFromBudget: !sub.excludeFromBudget } : sub
            )
        };
        await updateMonthData({ subcategories: newSubcategories });
    }, [currentMonthData.subcategories, updateMonthData]);

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
    ) => {
        const dataAtStart = allDataRef.current;
        if (!currentUser || dataAtStart[month]) return;

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

            setGuestDataInStorage(commitAllData(prev => ({
                ...prev,
                [month]: { transactions: guestTransactions, subcategories: subcategoriesToUse }
            })));
            return;
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
            return;
        }

        if (resolved.length === 0) return;

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
            return;
        }

        commitAllData(prev => ({
            ...prev,
            [month]: { ...prev[month], transactions: (data as Transaction[]).sort(byDateDesc) }
        }));
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

    const deleteMonth = useCallback(async (monthToDelete: string) => {
        const prevAllData = allDataRef.current;
        if (!currentUser || Object.keys(prevAllData).length <= 1) {
            console.error("Cannot delete the only budget month.");
            return;
        }

        const newData = commitAllData(prev => {
            const next = { ...prev };
            delete next[monthToDelete];
            return next;
        });

        if (currentUser.id === GUEST_USER_ID) {
            setGuestDataInStorage(newData);
            return;
        }

        const { error: budgetError } = await supabase.from('budgets').delete().match({ user_id: currentUser.id, month: monthToDelete });
        const { error: transError } = await supabase.from('transactions').delete().match({ user_id: currentUser.id, month: monthToDelete });

        if (budgetError || transError) {
            console.error("Error deleting month:", budgetError || transError);
            commitAllData(prevAllData); // Revert
        }
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
        transactions: currentMonthData.transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        subcategories: currentMonthData.subcategories,
        addSubcategory,
        deleteSubcategory,
        updateSubcategory,
        updateSubcategoryExpected,
        toggleSubcategoryExcludeFromBudget,
        actualAmounts,
        expectedAmounts,
        actualsBySubcategory,
        remainingToBudget,
        remainingToSpend,
        availableMonths,
        createNewMonth,
        applyRecurringToMonth,
        deleteMonth,
        allData, // Expose all data for dashboard charts
    };
};
