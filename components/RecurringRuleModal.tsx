import React, { useState, useEffect } from 'react';
import { CARD_STYLE, BTN_GHOST, BTN_PRIMARY } from '../constants';
import XIcon from './icons/XIcon';
import type { RecurringRule, CategoryName, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import SubcategorySelect from './SubcategorySelect';
import SelectField from './SelectField';

interface RecurringRuleModalProps {
  onClose: () => void;
  onSave: (rule: Omit<RecurringRule, 'id'>) => void;
  rule?: RecurringRule;      // absent when adding
  subcategories: Subcategories;
}

const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({ onClose, onSave, rule, subcategories }) => {
  const [category, setCategory] = useState<CategoryName>(rule?.category ?? 'Bills');
  const [subcategory, setSubcategory] = useState(rule?.subcategory ?? '');
  const [amount, setAmount] = useState(rule ? String(rule.amount) : '');
  const [dayOfMonth, setDayOfMonth] = useState(rule ? String(rule.day_of_month) : '1');
  const [note, setNote] = useState(rule?.note ?? '');
  const [active, setActive] = useState(rule?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSubcategory = subcategory.trim();
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dayOfMonth, 10);

    if (!trimmedSubcategory || !amount) {
      setError('Please fill out all required fields.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Amount must be zero or more.');
      return;
    }
    if (!Number.isFinite(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setError('Day of month must be between 1 and 31.');
      return;
    }

    onSave({
      category,
      subcategory: trimmedSubcategory,
      amount: parsedAmount,
      // Clamped here too — the input's min/max attributes are only advisory.
      day_of_month: Math.min(Math.max(parsedDay, 1), 31),
      note: note.trim(),
      active,
    });
    onClose();
  };

  const inputClass = "bg-white border border-black/15 rounded-lg py-2 px-3 text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className={`${CARD_STYLE} w-full max-w-lg p-4 sm:p-6 animate-fade-in my-auto`} onClick={e => e.stopPropagation()}>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in { animation: fade-in 0.2s ease-out; }
        `}</style>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-black/87">
            {rule ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
          </h3>
          <button onClick={onClose} className="text-black/40 hover:text-black/70" aria-label="Close">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="rec-category" className="text-sm font-medium text-black/60 mb-1">Category</label>
            <SelectField
              id="rec-category"
              value={category}
              onChange={e => { setCategory(e.target.value as CategoryName); setSubcategory(''); }}
            >
              {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectField>
          </div>

          <div className="flex flex-col">
            <label htmlFor="rec-subcategory" className="text-sm font-medium text-black/60 mb-1">Subcategory</label>
            {/* keyed on the category so switching categories resets the create-new state */}
            <SubcategorySelect
              key={category}
              id="rec-subcategory"
              value={subcategory}
              onChange={setSubcategory}
              options={subcategories[category] || []}
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="rec-amount" className="text-sm font-medium text-black/60 mb-1">Amount</label>
            <input
              type="number"
              id="rec-amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="rec-day" className="text-sm font-medium text-black/60 mb-1">Day of month</label>
            <input
              type="number"
              id="rec-day"
              value={dayOfMonth}
              onChange={e => setDayOfMonth(e.target.value)}
              required
              min="1"
              max="31"
              className={inputClass}
            />
            <p className="text-xs text-black/40 mt-1">If a month is shorter, this moves to the last day.</p>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label htmlFor="rec-note" className="text-sm font-medium text-black/60 mb-1">Note (Optional)</label>
            <input
              type="text"
              id="rec-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Monthly subscription"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="rec-active"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="accent-green-accent w-4 h-4"
            />
            <label htmlFor="rec-active" className="text-sm text-black/70">
              Active — offer this when creating a new month
            </label>
          </div>

          {error && <p className="text-danger text-sm text-center md:col-span-2">{error}</p>}

          <div className="md:col-span-2 mt-4 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY}>{rule ? 'Save Changes' : 'Add Rule'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringRuleModal;
