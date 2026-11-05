import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { RecurringRule } from '../types';
import { CATEGORY_NAMES } from '../types';
import { GUEST_USER_ID } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { isRecurringRule, recurringInputError, recurringWriteFailure } from '../utils/recurring';
import type { RecurringRuleInput, RecurringWriteResult } from '../utils/recurring';
import type { User } from '@supabase/supabase-js';

const LOCAL_STORAGE_KEY = 'zenith-guest-recurring';
const SELECT_COLUMNS = 'id, category, subcategory, amount, note, day_of_month, active';
const getGuestInitialRules = (): RecurringRule[] => [
    { id: 'guest-rec-1', category: 'Bills', subcategory: 'Rent', amount: 2000, note: 'Monthly Rent', day_of_month: 1, active: true },
    { id: 'guest-rec-2', category: 'Bills', subcategory: 'Internet', amount: 60, note: 'Comcast', day_of_month: 10, active: true },
];

export const useRecurring = (currentUser: User | null) => {
    const [rules, setRules] = useState<RecurringRule[]>([]);
    const rulesRef = useRef(rules);
    const [loadedUser, setLoadedUser] = useState<string | null | undefined>(undefined);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadVersion, setLoadVersion] = useState(0);
    const session = useRef({ id: currentUser?.id });
    if (session.current.id !== currentUser?.id) session.current = { id: currentUser?.id };
    const owner = session.current;
    const pending = useRef(false);
    const uncertain = useRef(false);
    const retryRecurringLoad = useCallback(() => setLoadVersion(version => version + 1), []);
    const commit = useCallback((next: RecurringRule[]) => { rulesRef.current = next; setRules(next); }, []);

    useEffect(() => {
        let cancelled = false;
        setLoadedUser(undefined);
        setLoadError(null);
        commit([]);
        pending.current = false;
        uncertain.current = false;
        const load = async () => {
            try {
                if (!currentUser) return;
                let data: unknown;
                if (currentUser.id === GUEST_USER_ID) {
                    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
                    data = raw === null ? getGuestInitialRules() : JSON.parse(raw);
                    if (!Array.isArray(data) || !data.every(isRecurringRule)) throw new Error('Saved recurring rules could not be read. They have not been replaced.');
                    if (raw === null) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
                } else {
                    const response = await supabase.from('recurring_transactions').select(SELECT_COLUMNS).eq('user_id', currentUser.id);
                    if (response.error) throw new Error('Could not load your recurring rules. Please try again.');
                    data = response.data;
                    if (!Array.isArray(data) || !data.every(isRecurringRule)) throw new Error('Your recurring rules could not be read. Please reload or try again.');
                }
                if (!cancelled && session.current === owner) commit(data as RecurringRule[]);
            } catch (error) {
                if (!cancelled && session.current === owner) setLoadError(error instanceof SyntaxError
                    ? 'Saved recurring rules could not be read. They have not been replaced.'
                    : error instanceof Error ? error.message : 'Could not load recurring rules. Check browser storage and try again.');
            } finally {
                if (!cancelled && session.current === owner) setLoadedUser(currentUser?.id ?? null);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [currentUser?.id, owner, loadVersion, commit]);

    const write = useCallback(async (action: 'add' | 'update' | 'delete', input?: RecurringRuleInput, id?: string): Promise<RecurringWriteResult> => {
        if (!currentUser || session.current !== owner || loadedUser !== currentUser.id || loadError) return { error: 'Load your recurring rules before making changes.' };
        if (pending.current) return { error: 'Wait for the current change to finish.' };
        if (uncertain.current) return { error: 'Reload and check your recurring rules before trying again.', uncertain: true };
        if (input) { const error = recurringInputError(input); if (error) return { error }; }
        if (action !== 'add' && !rulesRef.current.some(rule => rule.id === id)) return { error: 'This rule is no longer available. Reload your rules.' };
        const fields = input ? { category: input.category, subcategory: input.subcategory.trim(), amount: input.amount, day_of_month: input.day_of_month, note: input.note.trim(), active: input.active } : undefined;
        pending.current = true;
        try {
            let record: RecurringRule | undefined;
            if (currentUser.id === GUEST_USER_ID) {
                record = fields ? { ...fields, id: id ?? crypto.randomUUID() } : undefined;
            } else {
                const query = supabase.from('recurring_transactions');
                const response = action === 'add'
                    ? await query.insert({ ...fields, user_id: currentUser.id }).select(SELECT_COLUMNS).single()
                    : action === 'update'
                        ? await query.update(fields).match({ id, user_id: currentUser.id }).select(SELECT_COLUMNS)
                        : await query.delete().match({ id, user_id: currentUser.id }).select('id');
                if (response.error) {
                    const result = recurringWriteFailure('this recurring rule', response.error, response.status);
                    if (result.uncertain && session.current === owner) uncertain.current = true;
                    return result;
                }
                if (action === 'add') {
                    if (!isRecurringRule(response.data)) { if (session.current === owner) uncertain.current = true; return recurringWriteFailure('this recurring rule'); }
                    record = response.data;
                } else {
                    if (!Array.isArray(response.data)) {
                        if (session.current === owner) uncertain.current = true;
                        return recurringWriteFailure('this recurring rule');
                    }
                    if (response.data.length !== 1 || response.data[0].id !== id) return { error: 'No changed rule was returned. Reload your rules before trying again.' };
                    if (action === 'update') {
                        if (!isRecurringRule(response.data[0])) { if (session.current === owner) uncertain.current = true; return recurringWriteFailure('this recurring rule'); }
                        record = response.data[0];
                    }
                }
            }
            if (session.current !== owner) return { error: 'Your account changed. Reload to check the saved rule.', uncertain: true };
            const next = action === 'add' ? [...rulesRef.current, record!]
                : action === 'update' ? rulesRef.current.map(rule => rule.id === id ? record! : rule)
                    : rulesRef.current.filter(rule => rule.id !== id);
            if (currentUser.id === GUEST_USER_ID) {
                try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next)); }
                catch { return { error: 'Could not save your rules on this device. Check browser storage and try again.' }; }
            }
            commit(next);
            return { error: null };
        } catch {
            if (session.current === owner) uncertain.current = true;
            return recurringWriteFailure('this recurring rule');
        } finally { if (session.current === owner) pending.current = false; }
    }, [currentUser, owner, loadedUser, loadError, commit]);

    const addRule = useCallback((input: RecurringRuleInput) => write('add', input), [write]);
    const updateRule = useCallback((rule: RecurringRule) => write('update', rule, rule.id), [write]);
    const deleteRule = useCallback((id: string) => write('delete', undefined, id), [write]);
    const toggleRuleActive = useCallback((id: string) => {
        const rule = rulesRef.current.find(item => item.id === id);
        return rule ? updateRule({ ...rule, active: !rule.active }) : Promise.resolve({ error: 'This rule is no longer available.' });
    }, [updateRule]);
    const isRecurringLoaded = loadedUser === (currentUser?.id ?? null);
    const sortedRules = useMemo(() => !isRecurringLoaded || loadError ? [] : [...rules].sort((a, b) =>
        CATEGORY_NAMES.indexOf(a.category) - CATEGORY_NAMES.indexOf(b.category)
        || a.day_of_month - b.day_of_month || a.subcategory.localeCompare(b.subcategory)
    ), [rules, isRecurringLoaded, loadError]);
    const activeRules = useMemo(() => sortedRules.filter(rule => rule.active), [sortedRules]);
    return { isRecurringLoaded, recurringLoadError: loadError, retryRecurringLoad, rules: sortedRules, activeRules, addRule, updateRule, deleteRule, toggleRuleActive };
};
