import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Transaction, CategoryName, Subcategory, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
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
                setAllData({});
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
                setAllData(guestData);
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
                .select('id, date, category, subcategory, amount, note, month')
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

            setAllData(newAllData);
            setIsLoaded(true);
        };

        fetchData();
    }, [currentUser, setGuestDataInStorage]);

    const currentMonthData = useMemo(() => allData[selectedMonth] || { transactions: [], subcategories: blankSubcategories }, [allData, selectedMonth]);

    const updateMonthData = useCallback(async (data: Partial<MonthData>) => {
        if (!currentUser) return;

        const prevAllData = allData;
        const newAllData = {
            ...allData,
            [selectedMonth]: {
                ...(allData[selectedMonth] || { transactions: [], subcategories: blankSubcategories }),
                ...data,
            }
        };
        setAllData(newAllData);

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
                setAllData(prevAllData); // Revert on error
            }
        }
    }, [selectedMonth, currentUser, allData, setGuestDataInStorage]);

    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
        if (!currentUser) return;

        if (currentUser.id === GUEST_USER_ID) {
            const newTransaction: Transaction = { ...transaction, id: crypto.randomUUID() };
            const currentMonth = allData[selectedMonth] || { transactions: [], subcategories: blankSubcategories };
            const newTransactions = [newTransaction, ...currentMonth.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const newAllData = { ...allData, [selectedMonth]: { ...currentMonth, transactions: newTransactions } };
            setAllData(newAllData);
            setGuestDataInStorage(newAllData);
            return;
        }

        const transactionData = { ...transaction, user_id: currentUser.id, month: selectedMonth };
        const { data, error } = await supabase.from('transactions').insert(transactionData).select().single();

        if (error || !data) {
            console.error("Error adding transaction:", error);
            return;
        }

        const newTransaction: Transaction = data as Transaction;
        const newTransactions = [newTransaction, ...currentMonthData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllData(prev => ({ ...prev, [selectedMonth]: { ...prev[selectedMonth], transactions: newTransactions } }));
    }, [currentMonthData.transactions, selectedMonth, currentUser, allData, setGuestDataInStorage]);

    const updateTransaction = useCallback(async (updatedTransaction: Transaction) => {
        if (!currentUser) return;
        const newTransactions = currentMonthData.transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);

        if (currentUser.id === GUEST_USER_ID) {
            const newAllData = { ...allData, [selectedMonth]: { ...allData[selectedMonth], transactions: newTransactions } };
            setAllData(newAllData);
            setGuestDataInStorage(newAllData);
            return;
        }

        const { id, ...updateData } = updatedTransaction;
        const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
        if (error) {
            console.error("Error updating transaction:", error);
            return;
        }
        setAllData(prev => ({ ...prev, [selectedMonth]: { ...prev[selectedMonth], transactions: newTransactions } }));
    }, [currentMonthData.transactions, selectedMonth, currentUser, allData, setGuestDataInStorage]);

    const deleteTransaction = useCallback(async (id: string) => {
        if (!currentUser) return;
        const newTransactions = currentMonthData.transactions.filter(t => t.id !== id);

        if (currentUser.id === GUEST_USER_ID) {
            const newAllData = { ...allData, [selectedMonth]: { ...allData[selectedMonth], transactions: newTransactions } };
            setAllData(newAllData);
            setGuestDataInStorage(newAllData);
            return;
        }

        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
            console.error("Error deleting transaction:", error);
            return;
        }
        setAllData(prev => ({ ...prev, [selectedMonth]: { ...prev[selectedMonth], transactions: newTransactions } }));
    }, [currentMonthData.transactions, selectedMonth, currentUser, allData, setGuestDataInStorage]);

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

    // Accept an optional sourceMonth when copying
    const createNewMonth = useCallback(async (month: string, option: 'copy' | 'blank' | 'scratch', sourceMonth?: string) => {
        if (!currentUser || allData[month]) return;

        let subcategoriesToUse: Subcategories;
        if (option === 'scratch') {
            subcategoriesToUse = blankSubcategories;
        } else {
            // Helper to compute previous month string
            const getPreviousMonthStr = (monthStr: string) => {
                const [y, m] = monthStr.split('-').map(Number);
                const d = new Date(y, m - 1);
                d.setMonth(d.getMonth() - 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            };

            // Determine source to copy from: explicit sourceMonth (if provided and exists), else previous month relative to target, else fallback to most recent month
            let sourceToUse: string | null = null;
            if (sourceMonth && allData[sourceMonth]) {
                sourceToUse = sourceMonth;
            } else {
                const prev = getPreviousMonthStr(month);
                if (allData[prev]) {
                    sourceToUse = prev;
                } else {
                    const sortedMonths = Object.keys(allData).sort().reverse();
                    sourceToUse = sortedMonths.length > 0 ? sortedMonths[0] : null;
                }
            }

            const subcategoriesToCopyFrom = sourceToUse ? allData[sourceToUse].subcategories : blankSubcategories;
            subcategoriesToUse = JSON.parse(JSON.stringify(subcategoriesToCopyFrom));

            if (option === 'blank') {
                for (const category in subcategoriesToUse) {
                    (subcategoriesToUse[category as CategoryName] as Subcategory[]).forEach(sub => { sub.expected = 0; });
                }
            }
        }

        const newAllData = { ...allData, [month]: { transactions: [], subcategories: subcategoriesToUse } };
        setAllData(newAllData);

        if (currentUser.id === GUEST_USER_ID) {
            setGuestDataInStorage(newAllData);
            return;
        }

        const { error } = await supabase.from('budgets').insert({ user_id: currentUser.id, month: month, subcategories: subcategoriesToUse });
        if (error) {
            console.error("Error creating new month:", error);
            setAllData(allData); // Revert
        }
    }, [allData, currentUser, setGuestDataInStorage]);

    const deleteMonth = useCallback(async (monthToDelete: string) => {
        if (!currentUser || Object.keys(allData).length <= 1) {
            console.error("Cannot delete the only budget month.");
            return;
        }

        const prevAllData = { ...allData };
        const newData = { ...allData };
        delete newData[monthToDelete];
        setAllData(newData);

        if (currentUser.id === GUEST_USER_ID) {
            setGuestDataInStorage(newData);
            return;
        }

        const { error: budgetError } = await supabase.from('budgets').delete().match({ user_id: currentUser.id, month: monthToDelete });
        const { error: transError } = await supabase.from('transactions').delete().match({ user_id: currentUser.id, month: monthToDelete });

        if (budgetError || transError) {
            console.error("Error deleting month:", budgetError || transError);
            setAllData(prevAllData); // Revert
        }
    }, [allData, currentUser, setGuestDataInStorage]);

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
        deleteMonth,
        allData, // Expose all data for dashboard charts
    };
};
