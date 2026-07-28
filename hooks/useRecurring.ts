import { useState, useEffect, useMemo, useCallback } from 'react';
import type { RecurringRule } from '../types';
import { CATEGORY_NAMES } from '../types';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

const LOCAL_STORAGE_KEY = 'zenith-guest-recurring';

// Seeded for guest mode so the demo actually shows what the feature does. These
// point at subcategories the guest budget already has, so they never trigger the
// auto-create fallback.
const getGuestInitialRules = (): RecurringRule[] => [
    { id: 'guest-rec-1', category: 'Bills', subcategory: 'Rent', amount: 2000, note: 'Monthly Rent', day_of_month: 1, active: true },
    { id: 'guest-rec-2', category: 'Bills', subcategory: 'Internet', amount: 60, note: 'Comcast', day_of_month: 10, active: true },
];

const SELECT_COLUMNS = 'id, category, subcategory, amount, note, day_of_month, active';

export const useRecurring = (currentUser: User | null) => {
    const [rules, setRules] = useState<RecurringRule[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const getGuestRulesFromStorage = (): RecurringRule[] | null => {
        try {
            const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
            return rawData ? JSON.parse(rawData) : null;
        } catch (error) {
            console.error("Error reading guest recurring rules from localStorage", error);
            return null;
        }
    };

    const setGuestRulesInStorage = useCallback((data: RecurringRule[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving guest recurring rules to localStorage", error);
        }
    }, []);

    useEffect(() => {
        const fetchRules = async () => {
            if (!currentUser) {
                setRules([]);
                setIsLoaded(true);
                return;
            }

            setIsLoaded(false);

            if (currentUser.id === GUEST_USER_ID) {
                let guestRules = getGuestRulesFromStorage();
                if (!guestRules) {
                    guestRules = getGuestInitialRules();
                    setGuestRulesInStorage(guestRules);
                }
                setRules(guestRules);
                setIsLoaded(true);
                return;
            }

            const { data, error } = await supabase
                .from('recurring_transactions')
                .select(SELECT_COLUMNS)
                .eq('user_id', currentUser.id);

            if (error) {
                console.error("Error fetching recurring transactions:", error);
                setIsLoaded(true);
                return;
            }

            setRules((data || []) as RecurringRule[]);
            setIsLoaded(true);
        };

        fetchRules();
    }, [currentUser, setGuestRulesInStorage]);

    const addRule = useCallback(async (rule: Omit<RecurringRule, 'id'>) => {
        if (!currentUser) return;

        if (currentUser.id === GUEST_USER_ID) {
            const newRules = [...rules, { ...rule, id: crypto.randomUUID() }];
            setRules(newRules);
            setGuestRulesInStorage(newRules);
            return;
        }

        const { data, error } = await supabase
            .from('recurring_transactions')
            .insert({ ...rule, user_id: currentUser.id })
            .select(SELECT_COLUMNS)
            .single();

        if (error || !data) {
            console.error("Error adding recurring transaction:", error);
            return;
        }
        setRules(prev => [...prev, data as RecurringRule]);
    }, [rules, currentUser, setGuestRulesInStorage]);

    const updateRule = useCallback(async (updatedRule: RecurringRule) => {
        if (!currentUser) return;
        const newRules = rules.map(r => r.id === updatedRule.id ? updatedRule : r);

        if (currentUser.id === GUEST_USER_ID) {
            setRules(newRules);
            setGuestRulesInStorage(newRules);
            return;
        }

        const { id, ...updateData } = updatedRule;
        const { error } = await supabase.from('recurring_transactions').update(updateData).eq('id', id);
        if (error) {
            console.error("Error updating recurring transaction:", error);
            return;
        }
        setRules(newRules);
    }, [rules, currentUser, setGuestRulesInStorage]);

    const deleteRule = useCallback(async (id: string) => {
        if (!currentUser) return;
        const newRules = rules.filter(r => r.id !== id);

        if (currentUser.id === GUEST_USER_ID) {
            setRules(newRules);
            setGuestRulesInStorage(newRules);
            return;
        }

        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (error) {
            console.error("Error deleting recurring transaction:", error);
            return;
        }
        setRules(newRules);
    }, [rules, currentUser, setGuestRulesInStorage]);

    const toggleRuleActive = useCallback(async (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;
        await updateRule({ ...rule, active: !rule.active });
    }, [rules, updateRule]);

    // Sorted by category (in the app's canonical order), then by the day they fall on.
    const sortedRules = useMemo(() => {
        const order = (c: RecurringRule['category']) => CATEGORY_NAMES.indexOf(c);
        return [...rules].sort((a, b) =>
            order(a.category) - order(b.category)
            || a.day_of_month - b.day_of_month
            || a.subcategory.localeCompare(b.subcategory)
        );
    }, [rules]);

    const activeRules = useMemo(() => sortedRules.filter(r => r.active), [sortedRules]);

    return {
        isRecurringLoaded: isLoaded,
        rules: sortedRules,
        activeRules,
        addRule,
        updateRule,
        deleteRule,
        toggleRuleActive,
    };
};
