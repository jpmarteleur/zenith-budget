import React, { useState, useEffect, useMemo } from 'react';
import NavBar from './components/NavBar';
import BudgetPage from './pages/BudgetPage';
import DashboardPage from './pages/DashboardPage';
import HowToPage from './pages/HowToPage';
import SettingsPage from './pages/SettingsPage';
import { useBudget } from './hooks/useBudget';
import { useRecurring } from './hooks/useRecurring';
import { useAuth } from './hooks/useAuth';

export type Page = 'Budget' | 'Dashboard' | 'How To' | 'Settings';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const MainApp: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Budget');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const { currentUser } = useAuth();
  const budgetData = useBudget(selectedMonth, currentUser);
  // Hoisted here rather than into NavBar because the rules are needed in two places:
  // the New Month checklist and the Settings manager. One instance keeps them in sync.
  const recurringData = useRecurring(currentUser);

  // Lets the New Month modal preview which subcategories the new month will start
  // with, so the recurring checklist can flag any it would have to create.
  const subcategoriesByMonth = useMemo(
    () => Object.fromEntries(
      Object.keys(budgetData.allData).map(m => [m, budgetData.allData[m].subcategories])
    ),
    [budgetData.allData]
  );

  useEffect(() => {
    if (budgetData.isLoaded && budgetData.availableMonths.length > 0 && !budgetData.availableMonths.includes(selectedMonth)) {
      setSelectedMonth(budgetData.availableMonths[0]);
    }
  }, [budgetData.isLoaded, budgetData.availableMonths, selectedMonth]);

  const renderPage = () => {
    switch (activePage) {
      case 'Budget':
        return <BudgetPage {...budgetData} selectedMonth={selectedMonth} activeRecurringRules={recurringData.activeRules} />;
      case 'Dashboard':
        return <DashboardPage {...budgetData} selectedMonth={selectedMonth} />;
      case 'How To':
        return <HowToPage />;
      case 'Settings':
        return <SettingsPage {...recurringData} subcategories={budgetData.subcategories} />;
      default:
        return <BudgetPage {...budgetData} selectedMonth={selectedMonth} activeRecurringRules={recurringData.activeRules} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* House Green header band — the espresso-dark bookend */}
      <header className="bg-house-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white">Zenith Budget</h1>
          <p className="text-white/70 mt-2 text-sm tracking-wide">Manage Your Assets</p>
        </div>
      </header>
      <div className="flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <NavBar
            activePage={activePage}
            setActivePage={setActivePage}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            availableMonths={budgetData.availableMonths}
            createNewMonth={budgetData.createNewMonth}
            deleteMonth={budgetData.deleteMonth}
            activeRecurringRules={recurringData.activeRules}
            subcategoriesByMonth={subcategoriesByMonth}
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
