import React from 'react';
import { CARD_STYLE, BTN_GHOST, BTN_DANGER } from '../constants';
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`${CARD_STYLE} w-full max-w-md p-6 animate-fade-in`}
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
          <h3 className="text-xl font-bold text-black/87">{title}</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black/70">
            <XIcon className="w-6 h-6"/>
          </button>
        </div>

        <div className="text-black/70 mb-6">
          {children}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className={BTN_GHOST}>
            Cancel
          </button>
          <button onClick={onConfirm} className={BTN_DANGER}>
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationModal;