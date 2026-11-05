import React, { useState, useEffect, useMemo } from 'react';
import NavBar from './components/NavBar';
import BudgetPage from './pages/BudgetPage';
import HowToPage from './pages/HowToPage';
import SettingsPage from './pages/SettingsPage';
import { useBudget } from './hooks/useBudget';
import { useRecurring } from './hooks/useRecurring';
import { useAuth } from './hooks/useAuth';
import { useRecurringAutoApply } from './hooks/useRecurringAutoApply';
import { currentMonthKey } from './utils/dates';

export type Page = 'Budget' | 'How To' | 'Settings';

const MainApp: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Budget');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());
  const { currentUser } = useAuth();
  const budgetData = useBudget(selectedMonth, currentUser);
  // Hoisted here rather than into NavBar because the rules are needed in two places:
  // the New Month checklist and the Settings manager. One instance keeps them in sync.
  const recurringData = useRecurring(currentUser);

  // Materialises recurring rules into the *current* month as each one's day arrives.
  // Deliberately not tied to selectedMonth: browsing an old month must never write to it.
  const recurringApplyError = useRecurringAutoApply({
    currentUser,
    activeRules: recurringData.activeRules,
    isRecurringLoaded: recurringData.isRecurringLoaded && !recurringData.recurringLoadError,
    isBudgetLoaded: budgetData.isLoaded && !budgetData.loadError,
    allData: budgetData.allData,
    applyRecurringToMonth: budgetData.applyRecurringToMonth,
  });

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
        return <BudgetPage key={selectedMonth} {...budgetData} selectedMonth={selectedMonth} activeRecurringRules={recurringData.activeRules} />;
      case 'How To':
        return <HowToPage />;
      case 'Settings':
        return <SettingsPage {...recurringData} subcategories={budgetData.subcategories} />;
      default:
        return <BudgetPage key={selectedMonth} {...budgetData} selectedMonth={selectedMonth} activeRecurringRules={recurringData.activeRules} />;
    }
  };

  return (
    <div className="min-h-screen">
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
        isBudgetLoaded={budgetData.isLoaded && !budgetData.loadError}
      />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 focus:outline-none sm:px-6 lg:px-8">
        {activePage !== 'Settings' && recurringData.recurringLoadError && <div role="alert" className="mx-auto mb-6 max-w-4xl rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">
          <p>Recurring rules could not be loaded. Automatic application and recurring suggestions are unavailable.</p>
          <button type="button" onClick={() => setActivePage('Settings')} className="mt-2 min-h-11 rounded-lg font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-house-green">Open Settings to retry</button>
        </div>}
        {recurringApplyError && <div role="alert" className="mx-auto mb-6 max-w-4xl rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">
          <p>Automatic recurring application needs attention. {recurringApplyError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 min-h-11 rounded-lg font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-house-green">Reload activity</button>
        </div>}
        {renderPage()}
      </main>
    </div>
  );
};

export default MainApp;
