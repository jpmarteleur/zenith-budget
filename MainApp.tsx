import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import BudgetPage from './pages/BudgetPage';
import DashboardPage from './pages/DashboardPage';
import HowToPage from './pages/HowToPage';
import { useBudget } from './hooks/useBudget';
import { useAuth } from './hooks/useAuth';

export type Page = 'Budget' | 'Dashboard' | 'How To';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const MainApp: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Budget');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const { currentUser } = useAuth();
  const budgetData = useBudget(selectedMonth, currentUser);

  useEffect(() => {
    if (budgetData.isLoaded && budgetData.availableMonths.length > 0 && !budgetData.availableMonths.includes(selectedMonth)) {
        setSelectedMonth(budgetData.availableMonths[0]);
    }
  }, [budgetData.isLoaded, budgetData.availableMonths, selectedMonth]);

  const renderPage = () => {
    switch (activePage) {
      case 'Budget':
        return <BudgetPage {...budgetData} selectedMonth={selectedMonth} />;
      case 'Dashboard':
        return <DashboardPage {...budgetData} />;
      case 'How To':
        return <HowToPage />;
      default:
        return <BudgetPage {...budgetData} selectedMonth={selectedMonth} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans">
      <div className="futuristic-bg"></div>
      <div className="relative z-10 min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <header className="mb-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wider uppercase font-display" style={{textShadow: '0 0 8px rgba(34, 211, 238, 0.7)'}}>Zenith Budget</h1>
            <p className="text-cyan-400 mt-2 text-sm tracking-widest uppercase">Manage Your Assets</p>
          </header>
          <NavBar 
            activePage={activePage} 
            setActivePage={setActivePage}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            availableMonths={budgetData.availableMonths}
            createNewMonth={budgetData.createNewMonth}
            deleteMonth={budgetData.deleteMonth}
          />
          <main className="mt-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainApp;
