import React from 'react';
import type { useBudget } from '../hooks/useBudget';
import FlightPathChart from '../components/FlightPathChart';
import VelocityGauge from '../components/VelocityGauge';

type DashboardPageProps = ReturnType<typeof useBudget> & { selectedMonth: string };

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const { isLoaded, transactions, selectedMonth, expectedAmounts, actualAmounts } = props;

  if (!isLoaded) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FlightPathChart transactions={transactions} selectedMonth={selectedMonth} />
        <VelocityGauge
          expectedAmounts={expectedAmounts}
          actualAmounts={actualAmounts}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  );
};

export default DashboardPage;