
import type { CategoryName, Subcategories } from '../types';
import { decodeParsedTransaction } from '../utils/transactions';
import { todayKey } from '../utils/dates';

export const parseTransactionText = async (text: string, subcategories: Subcategories): Promise<{
    amount: number;
    category: CategoryName;
    subcategory: string;
    note: string;
} | null> => {
    try {
        const response = await fetch('/api/parse-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The handler runs on a UTC server, so it can't work out the user's
            // date on its own — send ours.
            body: JSON.stringify({ text, subcategories, today: todayKey() })
        });

        if (!response.ok) {
            let serverMsg = 'Failed to parse transaction';
            try {
                const errBody = await response.json();
                if (errBody && typeof errBody.error === 'string') {
                    serverMsg = errBody.error;
                }
            } catch {}
            throw new Error(serverMsg);
        }

        const parsedData: unknown = await response.json();
        return decodeParsedTransaction(parsedData);
    } catch (error) {
        console.error("Error parsing transaction with Gemini:", error);
        return null;
    }
};