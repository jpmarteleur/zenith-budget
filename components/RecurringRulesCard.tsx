import React, { useState } from 'react';
import type { RecurringRule, Subcategories } from '../types';
import { CATEGORY_NAMES } from '../types';
import { CARD_STYLE, BTN_PRIMARY, getCategoryColor } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { ordinal } from '../utils/dates';
import RecurringRuleModal from './RecurringRuleModal';
import ConfirmationModal from './ConfirmationModal';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';

interface RecurringRulesCardProps {
  rules: RecurringRule[];
  addRule: (rule: Omit<RecurringRule, 'id'>) => void;
  updateRule: (rule: RecurringRule) => void;
  deleteRule: (id: string) => void;
  toggleRuleActive: (id: string) => void;
  subcategories: Subcategories;
}

const RecurringRulesCard: React.FC<RecurringRulesCardProps> = ({
  rules, addRule, updateRule, deleteRule, toggleRuleActive, subcategories,
}) => {
  const { formatCurrency } = useSettings();
  // `null` = closed, `undefined` rule = adding, a rule = editing.
  const [editing, setEditing] = useState<{ rule?: RecurringRule } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringRule | null>(null);

  const handleSave = (data: Omit<RecurringRule, 'id'>) => {
    if (editing?.rule) {
      updateRule({ ...data, id: editing.rule.id });
    } else {
      addRule(data);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) deleteRule(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className={`${CARD_STYLE} p-6`}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-black/87">Recurring Transactions</h2>
          <p className="text-sm text-black/60 mt-1">
            Transactions that repeat on the same day every month. You'll review and confirm
            them each time you create a new month — they never change your Expected amounts.
          </p>
        </div>
        <button onClick={() => setEditing({})} className={`${BTN_PRIMARY} space-x-2 flex-shrink-0`}>
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Add Rule</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-black/40">
          No recurring transactions yet. Add one and it'll be offered every time you create a new month.
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORY_NAMES.map(catName => {
            const catRules = rules.filter(r => r.category === catName);
            if (catRules.length === 0) return null;
            const color = getCategoryColor(catName).hex;

            return (
              <div key={catName}>
                <h3 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color }}>
                  {catName}
                </h3>
                <div className="divide-y divide-black/5">
                  {catRules.map(rule => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-2 py-2 px-1 rounded hover:bg-green-mint/40 transition-colors ${rule.active ? '' : 'opacity-50'}`}
                    >
                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        className="text-black/40 hover:text-green-accent transition-colors flex-shrink-0"
                        title={rule.active ? 'Active — click to pause' : 'Paused — click to activate'}
                        aria-label={rule.active ? 'Pause rule' : 'Activate rule'}
                      >
                        {rule.active ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black/87 truncate">
                          {rule.subcategory}
                          {!rule.active && <span className="ml-1 text-[10px] text-black/40">(paused)</span>}
                        </div>
                        <div className="text-xs text-black/50 truncate">
                          on the {ordinal(rule.day_of_month)}
                          {rule.note ? ` · ${rule.note}` : ''}
                        </div>
                      </div>

                      <span className="font-mono text-sm text-black/87 text-right flex-shrink-0">
                        {formatCurrency(rule.amount)}
                      </span>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditing({ rule })}
                          className="p-1 text-black/40 hover:text-green-accent transition-colors"
                          aria-label={`Edit ${rule.subcategory}`}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rule)}
                          className="p-1 text-black/40 hover:text-danger transition-colors"
                          aria-label={`Delete ${rule.subcategory}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <RecurringRuleModal
          onClose={() => setEditing(null)}
          onSave={handleSave}
          rule={editing.rule}
          subcategories={subcategories}
        />
      )}

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Transaction"
      >
        <p>Stop <strong>{deleteTarget?.subcategory}</strong> from repeating each month?</p>
        <p className="mt-2 text-sm">
          Transactions already added to your budgets are kept — only the rule is removed.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default RecurringRulesCard;
