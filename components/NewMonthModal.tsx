import React, { useState, useEffect } from 'react';
import { CARD_STYLE, BTN_GHOST, BTN_PRIMARY } from '../constants';
import XIcon from './icons/XIcon';

type CreationOption = 'copy' | 'blank' | 'scratch';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // new signature: optional sourceMonth when copying
  onCreate: (month: string, option: CreationOption, sourceMonth?: string) => void;
  month: string;
  availableMonths: string[];
}

const NewMonthModal: React.FC<NewMonthModalProps> = ({ isOpen, onClose, onCreate, month, availableMonths }) => {
  const [creationOption, setCreationOption] = useState<CreationOption>('copy');
  const [selectedMonth, setSelectedMonth] = useState<string>(month);
  // sourceMonth used when copying: default to previous month relative to selectedMonth
  const getPreviousMonthStr = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const defaultSource = getPreviousMonthStr(selectedMonth);
  const [sourceMonth, setSourceMonth] = useState<string>(defaultSource);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate(selectedMonth, creationOption, creationOption === 'copy' ? sourceMonth : undefined);
  };

  const formattedMonth = new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`${CARD_STYLE} w-full max-w-md p-4 sm:p-6 animate-fade-in my-auto`}
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
                <select
                  value={sourceMonth}
                  onChange={e => setSourceMonth(e.target.value)}
                  className="mt-1 w-full bg-white border border-black/15 rounded-lg py-2 px-3 text-sm text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40"
                >
                  {/* default: previous month relative to selectedMonth */}
                  <option value={getPreviousMonthStr(selectedMonth)}>Previous month ({new Date(getPreviousMonthStr(selectedMonth) + '-02').toLocaleString('default',{month:'long', year:'numeric'})})</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{new Date(m + '-02').toLocaleString('default',{month:'long', year:'numeric'})}</option>
                  ))}
                </select>
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

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className={BTN_GHOST}>
            Cancel
          </button>
          <button onClick={handleCreate} className={BTN_PRIMARY}>
            Create Budget
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewMonthModal;