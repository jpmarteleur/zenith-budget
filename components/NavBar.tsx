import React, { useState } from 'react';
import type { Page } from '../MainApp';
import { FUTURISTIC_GLASS_STYLE } from '../constants';
import NewMonthModal from './NewMonthModal';
import ConfirmationModal from './ConfirmationModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TrashIcon from './icons/TrashIcon';
import LogoutIcon from './icons/LogoutIcon';
import { useAuth } from '../hooks/useAuth';

type CreationOption = 'copy' | 'blank' | 'scratch';

interface NavBarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  createNewMonth: (month: string, option: CreationOption, sourceMonth?: string) => void;
  deleteMonth: (month: string) => void;
}

const NavButton: React.FC<{
    pageName: Page;
    activePage: Page;
    onClick: (page: Page) => void;
}> = ({ pageName, activePage, onClick }) => {
    const isActive = activePage === pageName;
    return (
        <button
            onClick={() => onClick(pageName)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isActive
                    ? 'bg-cyan-500 text-black shadow-glow-cyan'
                    : 'text-gray-300 hover:bg-cyan-400/10 hover:text-cyan-300'
            }`}
        >
            {pageName}
        </button>
    );
};

const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

const getNextMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const NavBar: React.FC<NavBarProps> = ({ activePage, setActivePage, selectedMonth, setSelectedMonth, availableMonths, createNewMonth, deleteMonth }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const pages: Page[] = ['Budget', 'Dashboard', 'How To', 'Settings'];
  
  const mostRecentMonth = availableMonths[0] || selectedMonth;
  const nextMonth = getNextMonth(mostRecentMonth);
  const showCreateNew = !availableMonths.includes(nextMonth);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
        setIsModalOpen(true);
        // Reset selector to avoid getting stuck on the 'new' option
        e.target.value = selectedMonth; 
    } else {
        setSelectedMonth(value);
    }
  };
  
  const handleCreateMonth = (month: string, option: CreationOption, sourceMonth?: string) => {
    createNewMonth(month, option, sourceMonth);
    setSelectedMonth(month);
    setIsModalOpen(false);
  };

  const handleDeleteMonth = () => {
    deleteMonth(selectedMonth);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <nav className={`${FUTURISTIC_GLASS_STYLE} p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
        <div className="flex items-center space-x-2">
          {pages.map((page) => (
            <NavButton
              key={page}
              pageName={page}
              activePage={activePage}
              onClick={setActivePage}
            />
          ))}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 justify-end">
            {activePage !== 'How To' && activePage !== 'Settings' && (
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <select 
                            value={selectedMonth} 
                            onChange={handleMonthChange}
                            className="bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                        >
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{formatMonth(month)}</option>
                            ))}
                            {showCreateNew && <option value="new">Create budget for {formatMonth(nextMonth)}</option>}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                    {availableMonths.length > 1 && (
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            className="p-2 text-gray-400 hover:text-fuchsia-400 transition-colors rounded-md hover:bg-white/10"
                            aria-label="Delete selected month"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
            <div className="flex items-center space-x-2 border-l border-cyan-400/20 pl-2 sm:pl-4">
                <span className="text-sm text-gray-400 hidden sm:block truncate">{currentUser?.email}</span>
                <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-fuchsia-400 transition-colors rounded-md hover:bg-white/10"
                    aria-label="Logout"
                    title="Sign Out"
                >
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </nav>
      <NewMonthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateMonth}
        month={nextMonth}
        availableMonths={availableMonths}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteMonth}
        title="Delete Budget"
      >
        <p>Are you sure you want to delete the budget for <strong>{formatMonth(selectedMonth)}</strong>?</p>
        <p className="mt-2 text-sm">All associated transactions will be permanently removed. This action cannot be undone.</p>
      </ConfirmationModal>
    </>
  );
};

export default NavBar;