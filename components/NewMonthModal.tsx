import React, { useState } from 'react';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import XIcon from './icons/XIcon';

type CreationOption = 'copy' | 'blank' | 'scratch';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (month: string, option: CreationOption) => void;
  month: string;
  previousMonthFormatted: string;
}

const NewMonthModal: React.FC<NewMonthModalProps> = ({ isOpen, onClose, onCreate, month, previousMonthFormatted }) => {
  const [creationOption, setCreationOption] = useState<CreationOption>('copy');

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate(month, creationOption);
  };

  const formattedMonth = new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className={`${FUTURISTIC_GLASS_STYLE} w-full max-w-md p-6 rounded-2xl animate-fade-in`}
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
          <h3 className="text-xl font-bold text-white">Create Budget for {formattedMonth}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6"/>
          </button>
        </div>

        <p className="text-gray-400 mb-6">How would you like to set up this month's budget?</p>

        <div className="space-y-4">
          <div 
            onClick={() => setCreationOption('copy')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${creationOption === 'copy' ? 'bg-cyan-500/20 border-cyan-400' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
          >
            <h4 className="font-semibold text-white">Copy budget from {previousMonthFormatted}</h4>
            <p className="text-sm text-gray-400 mt-1">Start with the same 'Expected' amounts from last month.</p>
          </div>
          <div 
            onClick={() => setCreationOption('blank')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${creationOption === 'blank' ? 'bg-cyan-500/20 border-cyan-400' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
          >
            <h4 className="font-semibold text-white">Start with a blank budget</h4>
            <p className="text-sm text-gray-400 mt-1">Keep your subcategories, but set all 'Expected' amounts to $0.</p>
          </div>
          <div 
            onClick={() => setCreationOption('scratch')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${creationOption === 'scratch' ? 'bg-cyan-500/20 border-cyan-400' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
          >
            <h4 className="font-semibold text-white">Start from scratch</h4>
            <p className="text-sm text-gray-400 mt-1">Start completely fresh with no subcategories.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors">
            Create Budget
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewMonthModal;