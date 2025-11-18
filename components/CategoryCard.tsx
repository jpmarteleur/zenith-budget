import React, { useState, useEffect, useRef } from 'react';
import type { CategoryName, Subcategory } from '../types';
import { CATEGORY_COLORS, FUTURISTIC_GLASS_STYLE } from '../constants';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface CategoryCardProps {
  categoryName: CategoryName;
  expected: number;
  actual: number;
  subcategories: Subcategory[];
  actualsBySubcategory: Record<string, number>;
  onAddSubcategory: (category: CategoryName, name: string, expected: number) => void;
  onDeleteSubcategory: (category: CategoryName, id: string) => void;
  onUpdateSubcategoryExpected: (category: CategoryName, id: string, amount: number) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const SubcategoryRow: React.FC<{
  sub: Subcategory;
  categoryName: CategoryName;
  onDeleteSubcategory: (category: CategoryName, id: string) => void;
  onUpdateSubcategoryExpected: (category: CategoryName, id: string, amount: number) => void;
  actual: number;
}> = ({ sub, categoryName, onDeleteSubcategory, onUpdateSubcategoryExpected, actual }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(sub.expected.toString());
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditing) {
            setValue(sub.expected.toString());
        }
    }, [sub.expected, isEditing]);

    const handleSave = () => {
        const amount = parseFloat(value) || 0;
        onUpdateSubcategoryExpected(categoryName, sub.id, amount);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    const remaining = sub.expected - actual;
    const remainingColor = remaining >= 0 ? 'text-emerald-400' : 'text-red-500';
    const isIncome = categoryName === 'Income';

    return (
        <tr className="hover:bg-cyan-400/10">
            {/* Name */}
            <td className="px-1 py-1 align-middle text-gray-300 text-xs">{sub.name}</td>

            {/* Expected */}
            <td className="px-1 py-1 align-middle text-right border-l border-cyan-400/10 whitespace-nowrap">
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="w-20 bg-gray-900/50 text-right rounded-md py-0.5 px-1 text-white text-xs"
                  step="0.01"
                  autoFocus
                />
              ) : (
                <button onClick={() => setIsEditing(true)} className="cursor-pointer font-mono px-1 whitespace-nowrap tabular-nums text-gray-200 text-xs">
                  {formatCurrency(sub.expected)}
                </button>
              )}
            </td>

            {/* Remaining */}
            <td className={`px-1 py-1 align-middle text-right border-l border-cyan-400/10 font-mono text-xs tabular-nums ${isIncome ? '' : ''}`}>
              <span className={`${isIncome ? 'text-gray-500' : remainingColor} whitespace-nowrap`}>
                {isIncome ? '—' : formatCurrency(remaining)}
              </span>
            </td>

            {/* Delete */}
            <td className="px-1 py-1 align-middle text-right w-6">
              <button onClick={() => onDeleteSubcategory(categoryName, sub.id)} className="text-gray-500 hover:text-fuchsia-400">
                <TrashIcon className="w-3 h-3" />
              </button>
            </td>
        </tr>
    );
};

const CategoryCard: React.FC<CategoryCardProps> = ({ categoryName, expected, actual, subcategories, actualsBySubcategory, onAddSubcategory, onDeleteSubcategory, onUpdateSubcategoryExpected }) => {
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryExpected, setNewSubcategoryExpected] = useState('');
  const { text } = CATEGORY_COLORS[categoryName];
  const isIncome = categoryName === 'Income';
  
  const handleSubcategoryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubcategoryName.trim()) {
      const expectedAmount = parseFloat(newSubcategoryExpected) || 0;
      onAddSubcategory(categoryName, newSubcategoryName.trim(), expectedAmount);
      setNewSubcategoryName('');
      setNewSubcategoryExpected('');
    }
  };
  
  const progress = expected > 0 ? (actual / expected) * 100 : 0;

  return (
    <div className={`${FUTURISTIC_GLASS_STYLE} p-4 flex flex-col h-full`}>
      <h3 className={`text-lg font-bold ${text}`}>{categoryName}</h3>
      
      <div className="mt-2">
        <div className="text-xs text-gray-400">Expected</div>
        <p className="text-2xl font-semibold text-white font-display">{formatCurrency(expected)}</p>
      </div>

      <div className="mt-1">
         <p className="text-xs text-gray-400">Actual: <span className="font-medium text-gray-300">{formatCurrency(actual)}</span></p>
      </div>

      <div className="mt-4 h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-${CATEGORY_COLORS[categoryName].base}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
      
      <div className="mt-4 flex-grow overflow-hidden">
        <div className="mt-2">
          <table className="w-full text-xs">
            <colgroup>
              <col />
              <col style={{ width: '5.5rem' }} />
              <col style={{ width: '5.5rem' }} />
              <col style={{ width: '1.25rem' }} />
            </colgroup>
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-cyan-400/10">
                <th className="px-1 py-1 text-left">Subcategory</th>
                <th className="px-1 py-1 text-right border-l border-cyan-400/10">Expected</th>
                <th className="px-1 py-1 text-right border-l border-cyan-400/10">Remaining</th>
                <th className="px-1 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-400/10">
              {subcategories.map(sub => (
                <SubcategoryRow
                  key={sub.id}
                  sub={sub}
                  categoryName={categoryName}
                  onDeleteSubcategory={onDeleteSubcategory}
                  onUpdateSubcategoryExpected={onUpdateSubcategoryExpected}
                  actual={actualsBySubcategory[sub.name] || 0}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <form onSubmit={handleSubcategoryAdd} className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor={`new-sub-name-${categoryName}`} className="sr-only">New subcategory name</label>
        <input 
          id={`new-sub-name-${categoryName}`}
          type="text"
          value={newSubcategoryName}
          onChange={(e) => setNewSubcategoryName(e.target.value)}
          placeholder="New subcategory"
          className="flex-1 min-w-[120px] bg-gray-900/50 border border-cyan-400/30 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <div className="flex-shrink-0 flex items-center space-x-2">
          <label htmlFor={`new-sub-expected-${categoryName}`} className="sr-only">Expected amount</label>
          <input
              id={`new-sub-expected-${categoryName}`}
              type="number"
              value={newSubcategoryExpected}
              onChange={(e) => setNewSubcategoryExpected(e.target.value)}
              placeholder="$0.00"
              className="w-24 bg-gray-900/50 border border-cyan-400/30 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
              step="0.01"
          />
          <button type="submit" aria-label="Add subcategory" className="bg-cyan-600 p-1.5 rounded-md hover:bg-cyan-500 transition-colors">
            <PlusIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default CategoryCard;