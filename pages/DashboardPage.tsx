import React from 'react';
import type { useBudget } from '../hooks/useBudget';
import FlightPathChart from '../components/FlightPathChart';

type DashboardPageProps = ReturnType<typeof useBudget> & { selectedMonth: string };

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const { isLoaded, transactions, selectedMonth } = props;

  if (!isLoaded) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <FlightPathChart transactions={transactions} selectedMonth={selectedMonth} />
    </div>
  );
};

export default DashboardPage;