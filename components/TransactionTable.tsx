import React, { useState } from 'react';
import type { Transaction, Subcategories } from '../types';
import { CATEGORY_COLORS } from '../constants';
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
            <tr className="bg-gray-800/60">
                <td><input type="date" name="date" value={editData.date} onChange={handleChange} className="w-full bg-gray-900/80 p-2 rounded"/></td>
                <td>
                    <select name="category" value={editData.category} onChange={handleChange} className="w-full bg-gray-900/80 p-2 rounded">
                        {Object.keys(subcategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </td>
                <td>
                    <select name="subcategory" value={editData.subcategory} onChange={handleChange} className="w-full bg-gray-900/80 p-2 rounded">
                        <option value="" disabled>Select...</option>
                        {subcategories[editData.category]?.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                    </select>
                </td>
                <td><input type="number" name="amount" value={editData.amount} onChange={handleChange} className="w-full bg-gray-900/80 p-2 rounded"/></td>
                <td><input type="text" name="note" value={editData.note} onChange={handleChange} className="w-full bg-gray-900/80 p-2 rounded"/></td>
                <td className="p-3 text-right">
                    <div className="flex justify-end space-x-2">
                        <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => setIsEditing(false)} className="text-fuchsia-400 hover:text-fuchsia-300"><XIcon className="w-5 h-5"/></button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b border-cyan-400/10 hover:bg-cyan-400/5 transition-colors">
            <td className="p-3">{transaction.date}</td>
            <td className="p-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${CATEGORY_COLORS[transaction.category].bg} ${CATEGORY_COLORS[transaction.category].text}`}>
                {transaction.category}
              </span>
            </td>
            <td className="p-3">{transaction.subcategory}</td>
            <td className={`p-3 font-mono text-right ${transaction.category === 'Income' ? 'text-cyan-400' : 'text-gray-300'}`}>
                {formatCurrency(transaction.amount)}
            </td>
            <td className="p-3 text-gray-400">{transaction.note}</td>
            <td className="p-3 text-right">
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-sky-400"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(transaction.id)} className="text-gray-400 hover:text-fuchsia-400"><TrashIcon className="w-5 h-5"/></button>
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
            <h3 className="text-xl font-bold text-white">Transaction Log</h3>
            <button
                onClick={onLogTransactionClick}
                className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Log Transaction</span>
              </button>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-black/20 border-b-2 border-cyan-400/30">
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
            <div className="text-center py-8 text-gray-500">No transactions yet. Click 'Log Transaction' to get started.</div>
        )}
    </div>
  );
};

export default TransactionTable;