import React from 'react';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import XIcon from './icons/XIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

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
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6"/>
          </button>
        </div>

        <div className="text-gray-300 mb-6">
          {children}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-fuchsia-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-fuchsia-500 transition-colors">
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationModal;