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
        <li className="grid grid-cols-[1fr_auto_auto_24px] items-center gap-4 text-sm text-gray-400 hover:bg-cyan-400/10 p-1 rounded group">
            {/* Column 1: Name */}
            <span className="break-words pr-1">{sub.name}</span>

            {/* Column 2: Expected */}
            <div className="text-right">
              {isEditing ? (
                  <input
                      ref={inputRef}
                      type="number"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-gray-900/50 text-right rounded-md py-0.5 px-1 text-white min-w-[80px]"
                      autoFocus
                  />
              ) : (
                  <span onClick={() => setIsEditing(true)} className="cursor-pointer font-mono px-1 block whitespace-nowrap">
                      {formatCurrency(sub.expected)}
                  </span>
              )}
            </div>

            {/* Column 3: Remaining */}
            <div className={`text-right font-mono text-xs ${isIncome ? 'invisible' : ''}`}>
                <span className={`${remainingColor} whitespace-nowrap`}>
                    {formatCurrency(remaining)}
                </span>
            </div>

            {/* Column 4: Delete Button */}
            <div className="flex justify-center">
              <button onClick={() => onDeleteSubcategory(categoryName, sub.id)} className="text-gray-500 hover:text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrashIcon className="w-4 h-4" />
              </button>
            </div>
        </li>
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
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Subcategories</h4>
        
        {subcategories.length > 0 && (
          <div className="grid grid-cols-[1fr_auto_auto_24px] gap-4 text-xs text-gray-500 uppercase px-1 pb-1 border-b border-cyan-400/10">
              <span className="font-semibold">Subcategory</span>
              <span className="font-semibold text-right">Expected</span>
              <span className={`font-semibold text-right ${isIncome ? 'invisible' : ''}`}>Remaining</span>
              <span className="w-6"></span> {/* For alignment */}
          </div>
        )}

        <ul className="space-y-1 pt-1">
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
        </ul>
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