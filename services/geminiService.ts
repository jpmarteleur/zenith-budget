
import type { CategoryName, Subcategories } from '../types';

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
            body: JSON.stringify({ text, subcategories })
        });

        if (!response.ok) {
            throw new Error('Failed to parse transaction');
        }

        const parsedData = await response.json();

        if (
            typeof parsedData.amount === 'number' &&
            typeof parsedData.category === 'string' &&
            typeof parsedData.subcategory === 'string' &&
            typeof parsedData.note === 'string'
        ) {
            return {
                ...parsedData,
                category: parsedData.category as CategoryName,
            };
        }
        return null;
    } catch (error) {
        console.error("Error parsing transaction with Gemini:", error);
        return null;
    }
};