import React, { useState, useEffect, useMemo } from 'react';
import { CARD_STYLE, BTN_GHOST, BTN_PRIMARY } from '../constants';
import XIcon from './icons/XIcon';
import type { RecurringRule, RecurringApplyItem, Subcategories } from '../types';
import { resolveSourceMonth } from '../utils/dates';
import SelectField from './SelectField';
import RecurringChecklist, { buildInitialChecklistState, checklistToItems } from './RecurringChecklist';
import type { ChecklistState } from './RecurringChecklist';

type CreationOption = 'copy' | 'blank' | 'scratch';

const EMPTY_SUBCATEGORIES: Subcategories = {
  Income: [], Expenses: [], Bills: [], Savings: [], Investments: [], Debts: [],
};

interface NewMonthModalProps {
  onClose: () => void;
  // new signature: optional sourceMonth when copying
  onCreate: (month: string, option: CreationOption, sourceMonth?: string, recurringToApply?: RecurringApplyItem[]) => void;
  month: string;
  availableMonths: string[];
  activeRecurringRules: RecurringRule[];
  subcategoriesByMonth: Record<string, Subcategories>;
}

const NewMonthModal: React.FC<NewMonthModalProps> = ({ onClose, onCreate, month, availableMonths, activeRecurringRules, subcategoriesByMonth }) => {
  const [creationOption, setCreationOption] = useState<CreationOption>('copy');
  const [selectedMonth, setSelectedMonth] = useState<string>(month);
  const [checklist, setChecklist] = useState<ChecklistState>(() => buildInitialChecklistState(activeRecurringRules));
  const [isCreating, setIsCreating] = useState(false);
  // sourceMonth used when copying: default to previous month relative to selectedMonth
  const getPreviousMonthStr = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const defaultSource = getPreviousMonthStr(selectedMonth);
  const [sourceMonth, setSourceMonth] = useState<string>(defaultSource);

  // Lock body scroll while mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const monthAlreadyExists = availableMonths.includes(selectedMonth);

  // What the new month's subcategories will be, so the checklist can flag any a rule
  // would have to create. Resolved the same way createNewMonth resolves them.
  const targetSubcategories = useMemo(() => {
    if (creationOption === 'scratch') return EMPTY_SUBCATEGORIES;
    const source = resolveSourceMonth(
      availableMonths,
      selectedMonth,
      creationOption === 'copy' ? sourceMonth : undefined
    );
    return (source && subcategoriesByMonth[source]) || EMPTY_SUBCATEGORIES;
  }, [creationOption, availableMonths, selectedMonth, sourceMonth, subcategoriesByMonth]);

  const handleCreate = async () => {
    if (monthAlreadyExists || isCreating) return;
    setIsCreating(true);
    await onCreate(
      selectedMonth,
      creationOption,
      creationOption === 'copy' ? sourceMonth : undefined,
      checklistToItems(activeRecurringRules, checklist),
    );
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`${CARD_STYLE} w-full ${activeRecurringRules.length > 0 ? 'max-w-lg' : 'max-w-md'} p-4 sm:p-6 animate-fade-in my-auto`}
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
          <h3 className="text-xl font-bold text-black/87">Create a new budget for a month</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black/70">
            <XIcon className="w-6 h-6"/>
          </button>
        </div>

        <div className="mb-3">
          <label className="text-xs text-black/60 block mb-1">Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => {
              setSelectedMonth(e.target.value);
              // update default source when selected month changes
              setSourceMonth(getPreviousMonthStr(e.target.value));
            }}
            className="w-full bg-white border border-black/15 rounded-lg py-1 px-2 text-xs text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40"
          />
          <p className="text-xs text-black/40 mt-0.5">Choose any month: past, current, or future.</p>
          {monthAlreadyExists && (
            <p className="text-danger text-sm mt-1">
              A budget already exists for this month. Pick another, or use "Apply recurring" on the Budget page to add recurring transactions to it.
            </p>
          )}
        </div>

        <p className="text-black/60 mb-4">How would you like to set up this month's budget?</p>

        <div className="space-y-4">
          <div 
            onClick={() => setCreationOption('copy')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${creationOption === 'copy' ? 'bg-green-mint border-green-accent' : 'bg-white border-black/10 hover:border-green-accent/50'}`}
          >
            <h4 className="font-semibold text-black/87">Copy budget from another month</h4>
            <p className="text-sm text-black/60 mt-1">Copy the 'Expected' amounts from a source month.</p>
            {creationOption === 'copy' && (
              <div className="mt-3">
                <label className="text-xs text-black/60">Source month</label>
                <SelectField
                  value={sourceMonth}
                  onChange={e => setSourceMonth(e.target.value)}
                  className="mt-1 text-sm"
                >
                  {/* default: previous month relative to selectedMonth */}
                  <option value={getPreviousMonthStr(selectedMonth)}>Previous month ({new Date(getPreviousMonthStr(selectedMonth) + '-02').toLocaleString('default',{month:'long', year:'numeric'})})</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{new Date(m + '-02').toLocaleString('default',{month:'long', year:'numeric'})}</option>
                  ))}
                </SelectField>
              </div>
            )}
          </div>
          <div 
            onClick={() => setCreationOption('blank')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${creationOption === 'blank' ? 'bg-green-mint border-green-accent' : 'bg-white border-black/10 hover:border-green-accent/50'}`}
          >
            <h4 className="font-semibold text-black/87">Start with a blank budget</h4>
            <p className="text-sm text-black/60 mt-1">Keep your subcategories, but set all 'Expected' amounts to $0.</p>
          </div>
          <div 
            onClick={() => setCreationOption('scratch')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${creationOption === 'scratch' ? 'bg-green-mint border-green-accent' : 'bg-white border-black/10 hover:border-green-accent/50'}`}
          >
            <h4 className="font-semibold text-black/87">Start from scratch</h4>
            <p className="text-sm text-black/60 mt-1">Start completely fresh with no subcategories.</p>
          </div>
        </div>

        {activeRecurringRules.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-black/87">Recurring transactions</h4>
            <p className="text-sm text-black/60 mb-3">
              These will be added to the new month. Untick anything you don't want, or adjust an amount.
            </p>
            <RecurringChecklist
              rules={activeRecurringRules}
              month={selectedMonth}
              state={checklist}
              onStateChange={setChecklist}
              subcategories={targetSubcategories}
            />
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className={BTN_GHOST}>
            Cancel
          </button>
          <button onClick={handleCreate} className={BTN_PRIMARY} disabled={monthAlreadyExists || isCreating}>
            {isCreating ? 'Creating…' : 'Create Budget'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewMonthModal;