import React, { useState, useEffect } from 'react';
import { CARD_STYLE, BTN_GHOST, BTN_PRIMARY } from '../constants';
import XIcon from './icons/XIcon';
import type { RecurringRule, RecurringApplyItem, Subcategories } from '../types';
import RecurringChecklist, { buildInitialChecklistState, checklistToItems } from './RecurringChecklist';
import type { ChecklistState } from './RecurringChecklist';

interface ApplyRecurringModalProps {
  onClose: () => void;
  onApply: (items: RecurringApplyItem[]) => void;
  rules: RecurringRule[];          // active rules
  month: string;
  subcategories: Subcategories;
  appliedRuleIds: Set<string>;
}

const formatMonth = (monthStr: string) =>
  new Date(monthStr + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

const ApplyRecurringModal: React.FC<ApplyRecurringModalProps> = ({
  onClose, onApply, rules, month, subcategories, appliedRuleIds,
}) => {
  const [checklist, setChecklist] = useState<ChecklistState>(() => buildInitialChecklistState(rules));
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const items = checklistToItems(rules, checklist, appliedRuleIds);

  const handleApply = async () => {
    if (items.length === 0 || isApplying) return;
    setIsApplying(true);
    await onApply(items);
    setIsApplying(false);
    onClose();
  };

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
          <h3 className="text-xl font-bold text-black/87">Add Recurring Transactions</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black/70" aria-label="Close">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <p className="text-black/60 mb-4">
          Add these to <strong>{formatMonth(month)}</strong>. Anything already added is greyed out.
        </p>

        <RecurringChecklist
          rules={rules}
          month={month}
          state={checklist}
          onStateChange={setChecklist}
          subcategories={subcategories}
          appliedRuleIds={appliedRuleIds}
        />

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button onClick={handleApply} className={BTN_PRIMARY} disabled={items.length === 0 || isApplying}>
            {isApplying ? 'Adding…' : `Add ${items.length} Transaction${items.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyRecurringModal;
