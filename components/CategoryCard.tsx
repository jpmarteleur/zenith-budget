import React, { useState, useEffect, useRef } from 'react';
import type { CategoryName, Subcategory } from '../types';
import { getCategoryColor, CARD_STYLE, GOAL_CATEGORIES, AMOUNT_COLUMN_HEADERS } from '../constants';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import { useSettings } from '../contexts/SettingsContext';

interface CategoryCardProps {
  categoryName: CategoryName;
  expected: number;
  actual: number;
  subcategories: Subcategory[] | undefined;
  actualsBySubcategory: Record<string, number>;
  onAddSubcategory: (category: CategoryName, name: string, expected: number) => void;
  onDeleteSubcategory: (category: CategoryName, id: string) => void;
  onUpdateSubcategoryExpected: (category: CategoryName, id: string, amount: number) => void;
  onToggleExcludeFromBudget?: (category: CategoryName, id: string) => void;
}

const SubcategoryRow: React.FC<{
  sub: Subcategory;
  categoryName: CategoryName;
  onDeleteSubcategory: (category: CategoryName, id: string) => void;
  onUpdateSubcategoryExpected: (category: CategoryName, id: string, amount: number) => void;
  onToggleExcludeFromBudget?: (category: CategoryName, id: string) => void;
  actual: number;
}> = ({ sub, categoryName, onDeleteSubcategory, onUpdateSubcategoryExpected, onToggleExcludeFromBudget, actual }) => {
    const { formatCurrency } = useSettings();
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

    const isGoalCategory = GOAL_CATEGORIES.includes(categoryName);

    // Goal categories show money in, counting up toward `expected`.
    // Spend categories show budget left, counting down from `expected`.
    const amount = isGoalCategory ? actual : sub.expected - actual;

    // Compare in whole cents so the color always agrees with the rendered number —
    // a float residue like 1.8e-15 must not read as "budget left" on a $0.00 row.
    const cents = (n: number) => Math.round(n * 100);
    const delta = isGoalCategory ? cents(actual) - cents(sub.expected) : cents(amount);

    // Green good, red bad, grey neutral in every category; only what counts as
    // "good" changes. Goal categories: red short of the goal, grey on target, green
    // past it. Spend categories: green with budget left, grey at zero, red over.
    const amountColor = delta > 0 ? 'text-green-accent' : delta < 0 ? 'text-danger' : 'text-black/40';

    return (
        <tr className={`hover:bg-green-mint/50 ${sub.excludeFromBudget ? 'opacity-50' : ''}`}>
            {/* Budget visibility toggle */}
            <td className="px-1 py-1 align-middle w-4">
              <button
                onClick={() => onToggleExcludeFromBudget?.(categoryName, sub.id)}
                title={sub.excludeFromBudget ? "Hidden from budget (click to include)" : "Visible in budget (click to hide)"}
                className={`transition-colors ${sub.excludeFromBudget ? 'text-black/30 hover:text-black/50' : 'text-green-accent hover:text-sb-green'}`}
              >
                {sub.excludeFromBudget ? <EyeOffIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
              </button>
            </td>

            {/* Name */}
            <td className="px-1 py-1 align-middle text-black/70 text-xs">
              {sub.name}
              {sub.excludeFromBudget && <span className="ml-1 text-[10px] text-black/40">(hidden)</span>}
            </td>

            {/* Expected */}
            <td className="px-1 py-1 align-middle text-right border-l border-black/5 whitespace-nowrap">
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="w-20 bg-white border border-black/15 text-right rounded-md py-0.5 px-1 text-black/87 text-xs focus:outline-none focus:ring-1 focus:ring-green-accent/40"
                  step="0.01"
                  autoFocus
                />
              ) : (
                <button onClick={() => setIsEditing(true)} className="cursor-pointer font-mono px-1 whitespace-nowrap tabular-nums text-black/70 text-xs">
                  {formatCurrency(sub.expected)}
                </button>
              )}
            </td>

            {/* Remaining / Received / Saved / Invested */}
            <td className={`px-1 py-1 align-middle text-right border-l border-black/5 font-mono text-xs tabular-nums`}>
              <span className={`${amountColor} whitespace-nowrap`}>
                {formatCurrency(amount)}
              </span>
            </td>

            {/* Delete */}
            <td className="px-1 py-1 align-middle text-right w-6">
              <button onClick={() => onDeleteSubcategory(categoryName, sub.id)} className="text-black/40 hover:text-danger">
                <TrashIcon className="w-3 h-3" />
              </button>
            </td>
        </tr>
    );
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  categoryName,
  expected,
  actual,
  subcategories,
  actualsBySubcategory,
  onAddSubcategory,
  onDeleteSubcategory,
  onUpdateSubcategoryExpected,
  onToggleExcludeFromBudget,
}) => {
  const { formatCurrency } = useSettings();
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryExpected, setNewSubcategoryExpected] = useState('');
  const { hex } = getCategoryColor(categoryName);

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
    <div className={`${CARD_STYLE} p-4 flex flex-col h-full`}>
      <h3 className="text-lg font-bold" style={{ color: hex }}>{categoryName}</h3>

      <div className="mt-2">
        <div className="text-xs text-black/60">Expected</div>
        <p className="text-2xl font-semibold text-black/87">{formatCurrency(expected)}</p>
      </div>

      <div className="mt-1">
         <p className="text-xs text-black/60">Actual: <span className="font-medium text-black/70">{formatCurrency(actual)}</span></p>
      </div>

      <div className="mt-4 h-2 w-full bg-ceramic rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: hex }}></div>
      </div>

      <div className="mt-4 flex-grow overflow-hidden">
        <div className="mt-2">
          <table className="w-full text-xs">
            <colgroup>
              <col style={{ width: '1rem' }} />
              <col />
              <col style={{ width: '5.5rem' }} />
              <col style={{ width: '5.5rem' }} />
              <col style={{ width: '1.25rem' }} />
            </colgroup>
            <thead>
              <tr className="text-xs text-black/40 uppercase border-b border-black/5">
                <th className="px-1 py-1" title="Exclude from budget"></th>
                <th className="px-1 py-1 text-left">Subcategory</th>
                <th className="px-1 py-1 text-right border-l border-black/5">Expected</th>
                <th className="px-1 py-1 text-right border-l border-black/5">{AMOUNT_COLUMN_HEADERS[categoryName]}</th>
                <th className="px-1 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {(subcategories || []).map(sub => (
                <SubcategoryRow
                  key={sub.id}
                  sub={sub}
                  categoryName={categoryName}
                  onDeleteSubcategory={onDeleteSubcategory}
                  onUpdateSubcategoryExpected={onUpdateSubcategoryExpected}
                  onToggleExcludeFromBudget={onToggleExcludeFromBudget}
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
          className="flex-1 min-w-[120px] bg-white border border-black/15 rounded-lg py-1 px-2 text-sm text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40"
        />
        <div className="flex-shrink-0 flex items-center space-x-2">
          <label htmlFor={`new-sub-expected-${categoryName}`} className="sr-only">Expected amount</label>
          <input
              id={`new-sub-expected-${categoryName}`}
              type="number"
              value={newSubcategoryExpected}
              onChange={(e) => setNewSubcategoryExpected(e.target.value)}
              placeholder="$0.00"
              className="w-24 bg-white border border-black/15 rounded-lg py-1 px-2 text-sm text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40 text-right"
              step="0.01"
          />
          <button type="submit" aria-label="Add subcategory" className="bg-green-accent p-1.5 rounded-full hover:bg-sb-green transition-all duration-200 active:scale-95">
            <PlusIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default CategoryCard;
