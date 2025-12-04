

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { CategoryName, Transaction, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import PlusIcon from './icons/PlusIcon';
import XIcon from './icons/XIcon';
import { parseTransactionText } from '../services/geminiService';

interface TransactionFormProps {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  subcategories: Subcategories;
  addSubcategory: (category: CategoryName, name:string, expected?: number) => void;
  onClose: () => void;
  selectedMonth: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ addTransaction, subcategories, addSubcategory, onClose, selectedMonth }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  // Lock body scroll when form is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const [monthMin, monthMax] = useMemo(() => {
    if (!selectedMonth) return ['', ''];
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0); // Day 0 of next month is last day of current month
    return [
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
    ];
  }, [selectedMonth]);

  const getInitialDate = useCallback(() => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // If today is within the selected month's range, use today.
      if (todayStr >= monthMin && todayStr <= monthMax) {
          return todayStr;
      }
      // Otherwise, default to the first day of the selected month.
      return monthMin;
  }, [monthMin, monthMax]);
  
  // Manual form state
  const [manualDate, setManualDate] = useState(getInitialDate);
  const [manualCategory, setManualCategory] = useState<CategoryName>('Expenses');
  const [manualSubcategory, setManualSubcategory] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');

  // AI form state
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Omit<Transaction, 'id'> | null>(null);
  
  // State for AI-assisted subcategory creation
  const [isCreatingNewSub, setIsCreatingNewSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubExpected, setNewSubExpected] = useState('');

  // When AI data is parsed or the category is changed, decide whether to show dropdown or create new form
  useEffect(() => {
    if (parsedData) {
      const { category, subcategory } = parsedData;
      const subExists = subcategories[category]?.some(
        s => s.name.toLowerCase() === subcategory.toLowerCase()
      );
      
      if (!subExists && subcategory) {
        setIsCreatingNewSub(true);
        setNewSubName(subcategory);
        setNewSubExpected('');
      } else {
        setIsCreatingNewSub(false);
        setNewSubName('');
      }
    } else {
      setIsCreatingNewSub(false);
      setNewSubName('');
    }
  }, [parsedData, subcategories]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSubcategory = manualSubcategory.trim();
    if (!manualCategory || !trimmedSubcategory || !manualAmount) {
      alert('Please fill out all required fields.');
      return;
    }

    let finalSubcategoryName = trimmedSubcategory;

    const existingSubcategory = subcategories[manualCategory]?.find(
      s => s.name.toLowerCase() === trimmedSubcategory.toLowerCase()
    );

    if (existingSubcategory) {
      finalSubcategoryName = existingSubcategory.name;
    } else {
      addSubcategory(manualCategory, finalSubcategoryName);
    }
    
    addTransaction({
      date: manualDate,
      category: manualCategory,
      subcategory: finalSubcategoryName,
      amount: parseFloat(manualAmount),
      note: manualNote,
    });
    
    onClose();
  };
  
  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);

    const result = await parseTransactionText(inputText, subcategories);

    if (result) {
      setParsedData({
          date: getInitialDate(),
          amount: Math.abs(result.amount),
          category: result.category,
          subcategory: result.subcategory,
          note: result.note,
      });
      setError(null);
    } else {
      setError("Sorry, I couldn't understand that. Please try rephrasing.");
      setParsedData(null);
    }
    setIsLoading(false);
  };
  
  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData) return;
    setError(null);

    let subcategoryToSave: string;

    if (isCreatingNewSub) {
      const trimmedNewName = newSubName.trim();
      if (!trimmedNewName) {
        setError("New subcategory name cannot be empty.");
        return;
      }
      const subAlreadyExists = subcategories[parsedData.category]?.some(s => s.name.toLowerCase() === trimmedNewName.toLowerCase());
      if (subAlreadyExists) {
        setError(`Subcategory "${trimmedNewName}" already exists. Please choose it from the list.`);
        return;
      }
      addSubcategory(parsedData.category, trimmedNewName, parseFloat(newSubExpected) || 0);
      subcategoryToSave = trimmedNewName;
    } else {
      if (!parsedData.subcategory) {
        setError("Please select a subcategory.");
        return;
      }
      subcategoryToSave = parsedData.subcategory;
    }
    
    addTransaction({ ...parsedData, subcategory: subcategoryToSave });
    onClose();
  };

  const handleParsedDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setError(null); // Clear errors on change
      setParsedData(prev => {
          if (!prev) return null;
          const updated = { ...prev, [name]: value };
          if (name === 'amount') {
              updated.amount = parseFloat(value) || 0;
          }
          if (name === 'category') {
              updated.subcategory = ''; // Reset subcategory on category change
          }
          return updated;
      });
  };

  const resetAiTab = () => {
    setInputText('');
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div 
            className={`${FUTURISTIC_GLASS_STYLE} w-full max-w-2xl p-6 rounded-2xl animate-fade-in`}
            onClick={e => e.stopPropagation()}
        >
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
            `}</style>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Log Transaction</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            
            {/* TABS */}
            <div className="flex border-b border-cyan-400/20 mb-6">
                 <button onClick={() => setActiveTab('ai')} className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'ai' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                    AI Assist
                </button>
                <button onClick={() => setActiveTab('manual')} className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'manual' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                    Manual Entry
                </button>
            </div>

            {/* CONTENT */}
            {activeTab === 'manual' && (
                 <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="flex flex-col">
                        <label htmlFor="date" className="text-sm font-medium text-gray-400 mb-1">Date</label>
                        <input type="date" id="date" value={manualDate} onChange={e => setManualDate(e.target.value)} required
                                min={monthMin} max={monthMax}
                                className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="amount" className="text-sm font-medium text-gray-400 mb-1">Amount</label>
                        <input type="number" id="amount" value={manualAmount} onChange={e => setManualAmount(e.target.value)} required step="0.01" placeholder="0.00"
                                className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="category" className="text-sm font-medium text-gray-400 mb-1">Category</label>
                        <select id="category" value={manualCategory} onChange={e => {setManualCategory(e.target.value as CategoryName); setManualSubcategory('')}} required
                                className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none">
                            {CATEGORY_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="subcategory" className="text-sm font-medium text-gray-400 mb-1">Subcategory</label>
                         <input
                            id="subcategory"
                            type="text"
                            value={manualSubcategory}
                            onChange={e => setManualSubcategory(e.target.value)}
                            required
                            list="subcategory-list-manual"
                            className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <datalist id="subcategory-list-manual">
                            {subcategories[manualCategory]?.map(sub => <option key={sub.id} value={sub.name} />)}
                        </datalist>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                        <label htmlFor="note" className="text-sm font-medium text-gray-400 mb-1">Note</label>
                        <input type="text" id="note" value={manualNote} onChange={e => setManualNote(e.target.value)} placeholder="(Optional)"
                                className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <button type="submit" className="md:col-span-2 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors flex items-center justify-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Transaction</span>
                    </button>
                </form>
            )}
            
            {activeTab === 'ai' && (
                <div>
                    {!parsedData ? (
                        <>
                            <p className="text-gray-400 mb-4 text-sm">e.g., "$10 Chipotle", "$1500 rent", or "paycheck for $2500"</p>
                            <div className="flex space-x-2">
                                <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                                placeholder="Enter transaction..."
                                className="flex-grow bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={isLoading}
                                />
                                <button
                                onClick={handleParse}
                                disabled={isLoading || !inputText.trim()}
                                className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                {isLoading ? 'Parsing...' : 'Parse'}
                                </button>
                            </div>
                            {error && <p className="text-rose-400 mt-4 text-center">{error}</p>}
                        </>
                    ) : (
                        <form onSubmit={handleAiSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-400 mb-1">Date</label>
                                <input type="date" name="date" value={parsedData.date} onChange={handleParsedDataChange} required min={monthMin} max={monthMax} className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-400 mb-1">Amount</label>
                                <input type="number" name="amount" value={parsedData.amount} onChange={handleParsedDataChange} required step="0.01" placeholder="0.00" className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-400 mb-1">Category</label>
                                <select name="category" value={parsedData.category} onChange={handleParsedDataChange} required className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none">
                                    {CATEGORY_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="subcategory-ai" className="text-sm font-medium text-gray-400 mb-1">Subcategory</label>
                                {isCreatingNewSub ? (
                                    <div className="space-y-2 p-2 border border-cyan-400/30 rounded-md bg-gray-900/50">
                                        <input
                                            type="text"
                                            placeholder="New Subcategory Name"
                                            value={newSubName}
                                            onChange={(e) => setNewSubName(e.target.value)}
                                            required
                                            className="w-full bg-gray-800/80 border border-cyan-400/30 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Expected Budget (Optional)"
                                            value={newSubExpected}
                                            onChange={(e) => setNewSubExpected(e.target.value)}
                                            step="0.01"
                                            className="w-full bg-gray-800/80 border border-cyan-400/30 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                        <button type="button" onClick={() => { setIsCreatingNewSub(false); setError(null); }} className="text-xs text-cyan-400 hover:text-cyan-300">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        id="subcategory-ai"
                                        name="subcategory"
                                        value={parsedData.subcategory}
                                        onChange={(e) => {
                                            if (e.target.value === '__CREATE_NEW__') {
                                                setIsCreatingNewSub(true);
                                                setNewSubName('');
                                                setNewSubExpected('');
                                            } else {
                                                handleParsedDataChange(e);
                                            }
                                        }}
                                        required
                                        className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                                    >
                                        <option value="" disabled>Select or create...</option>
                                        {subcategories[parsedData.category]?.map(sub => (
                                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                                        ))}
                                        <option value="__CREATE_NEW__" className="italic text-cyan-400 font-semibold bg-gray-800">-- Create New --</option>
                                    </select>
                                )}
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium text-gray-400 mb-1">Note</label>
                                <input type="text" name="note" value={parsedData.note} onChange={handleParsedDataChange} placeholder="(Optional)" className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            {error && <p className="text-rose-400 text-sm text-center md:col-span-2">{error}</p>}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-4">
                                <button type="button" onClick={resetAiTab} className="bg-gray-600/50 text-gray-300 font-semibold py-2 px-4 rounded-md hover:bg-gray-600/80 transition-colors">
                                    Parse Another
                                </button>
                                <button type="submit" className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors flex items-center justify-center space-x-2">
                                    <PlusIcon className="w-5 h-5" />
                                    <span>Add Transaction</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default TransactionForm;
