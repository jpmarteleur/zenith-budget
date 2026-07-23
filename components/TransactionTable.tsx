import React, { useState } from 'react';
import type { Transaction, Subcategories } from '../types';
import { getCategoryColor, BTN_PRIMARY } from '../constants';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import { useSettings } from '../contexts/SettingsContext';

interface TransactionTableProps {
  transactions: Transaction[];
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  subcategories: Subcategories;
  onLogTransactionClick: () => void;
}

const TransactionRow: React.FC<{
    transaction: Transaction;
    onUpdate: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    subcategories: Subcategories;
}> = ({ transaction, onUpdate, onDelete, subcategories }) => {
    const { formatCurrency } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(transaction);

    const handleSave = () => {
        onUpdate({...editData, amount: Number(editData.amount) || 0});
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
        if(name === 'category'){
            setEditData(prev => ({...prev, subcategory: ''}));
        }
    };
    
    if (isEditing) {
        return (
            <tr className="bg-cream">
                <td><input type="date" name="date" value={editData.date} onChange={handleChange} className="w-full bg-white border border-black/15 p-2 rounded-lg text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40"/></td>
                <td>
                    <select name="category" value={editData.category} onChange={handleChange} className="w-full bg-white border border-black/15 p-2 rounded-lg text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40">
                        {Object.keys(subcategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </td>
                <td>
                    <select name="subcategory" value={editData.subcategory} onChange={handleChange} className="w-full bg-white border border-black/15 p-2 rounded-lg text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40">
                        <option value="" disabled>Select...</option>
                        {subcategories[editData.category]?.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                    </select>
                </td>
                <td><input type="number" name="amount" value={editData.amount} onChange={handleChange} className="w-full bg-white border border-black/15 p-2 rounded-lg text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40"/></td>
                <td><input type="text" name="note" value={editData.note} onChange={handleChange} className="w-full bg-white border border-black/15 p-2 rounded-lg text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40"/></td>
                <td className="p-3 text-right">
                    <div className="flex justify-end space-x-2">
                        <button onClick={handleSave} className="text-green-accent hover:text-sb-green"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => setIsEditing(false)} className="text-danger hover:opacity-70"><XIcon className="w-5 h-5"/></button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b border-black/5 hover:bg-green-mint/40 transition-colors">
            <td className="p-3">{transaction.date}</td>
            <td className="p-3">
              <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: `${getCategoryColor(transaction.category).hex}1A`, color: getCategoryColor(transaction.category).hex }}>
                {transaction.category}
              </span>
            </td>
            <td className="p-3">{transaction.subcategory}</td>
            <td className={`p-3 font-mono text-right ${transaction.category === 'Income' ? 'text-green-accent' : 'text-black/70'}`}>
                {formatCurrency(transaction.amount)}
            </td>
            <td className="p-3 text-black/50">{transaction.note}</td>
            <td className="p-3 text-right">
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsEditing(true)} className="text-black/40 hover:text-green-accent"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(transaction.id)} className="text-black/40 hover:text-danger"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </td>
        </tr>
    );
};


const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, updateTransaction, deleteTransaction, subcategories, onLogTransactionClick }) => {
  const { currency } = useSettings();
  return (
    <div className="mt-8 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-black/87">Transaction Log</h3>
            <button
                onClick={onLogTransactionClick}
                className={`${BTN_PRIMARY} space-x-2`}
              >
                <PlusIcon className="w-5 h-5" />
                <span>Log Transaction</span>
              </button>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-black/50 uppercase bg-ceramic border-b-2 border-black/10">
                <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Subcategory</th>
                    <th className="p-3 text-right">Amount ({currency.symbol})</th>
                    <th className="p-3">Note</th>
                    <th className="p-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map(t => (
                    <TransactionRow key={t.id} transaction={t} onUpdate={updateTransaction} onDelete={deleteTransaction} subcategories={subcategories}/>
                ))}
            </tbody>
        </table>
        {transactions.length === 0 && (
            <div className="text-center py-8 text-black/40">No transactions yet. Click 'Log Transaction' to get started.</div>
        )}
    </div>
  );
};

export default TransactionTable;